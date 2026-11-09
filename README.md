# LOOK vs C-LOOK – Interactive Disk Scheduling Simulator

## Run the backend (Python 3.10+)
```
cd backend
pip install -r requirements.txt
pytest                      # algorithm tests
uvicorn main:app --reload --port 8000
```
API docs: http://localhost:8000/docs · Endpoints: `POST /api/simulate`, `POST /api/compare`, `WS /ws/simulate`

## Run the frontend (Node 18+)
```
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api and /ws to :8000)
```

## Verified by hand (head 53, queue 98 183 37 122 14 124 65 67, right)
- LOOK: 53→183 = 130, 183→14 = 169, total **299**
- C-LOOK: 130 + jump 183→14 (169) + 14→37 (23) = **322**

## Notes
- Algorithms: `backend/algorithms/`, validation/orchestration: `services/`, routes: `main.py`.
- The jump distance is included in C-LOOK's total and also reported separately.
- Average seek = total movement / requests serviced.
- The UI replays the steps returned by `/api/compare`; `/ws/simulate` streams the same steps live for other clients.
