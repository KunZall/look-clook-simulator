"""FastAPI routes + WebSocket. Run: uvicorn main:app --reload --port 8000"""
import asyncio
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import RunInput, SimInput
from services import simulation_service as svc

app = FastAPI(title="LOOK vs C-LOOK Simulator")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/api/simulate")
def simulate(p: RunInput):
    try:
        return svc.run(p.algorithm, p.head, p.requests, p.min_cyl, p.max_cyl, p.direction)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/compare")
def compare(p: SimInput):
    try:
        return svc.compare(p.head, p.requests, p.min_cyl, p.max_cyl, p.direction)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.websocket("/ws/simulate")
async def ws_simulate(ws: WebSocket):
    """Client sends {algorithm, head, requests, min_cyl, max_cyl, direction, delay_ms};
    server streams each step live, then a final 'done' message with all metrics."""
    await ws.accept()
    try:
        d = await ws.receive_json()
        delay = d.pop("delay_ms", 600) / 1000
        try:
            res = svc.run(d["algorithm"], d["head"], d["requests"],
                          d.get("min_cyl", 0), d.get("max_cyl", 199), d.get("direction", "right"))
        except (ValueError, KeyError) as e:
            await ws.send_json({"type": "error", "message": str(e)})
            return
        for s in res["steps"]:
            await ws.send_json({"type": "step", "step": s})
            await asyncio.sleep(delay)
        await ws.send_json({"type": "done", "result": res})
    except WebSocketDisconnect:
        pass
