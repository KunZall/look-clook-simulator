"""Shared helper: turns an ordered list of head moves into steps and metrics."""


def build_result(name, head, moves):
    """moves = [(target_cylinder, kind)] where kind is 'seek' or 'jump'.
    Every move lands on (and services) one request. A 'jump' is the C-LOOK
    return from the last request in one direction to the first at the other end."""
    steps, pos = [], head
    for i, (target, kind) in enumerate(moves):
        steps.append({"order": i + 1, "from": pos, "to": target,
                      "distance": abs(target - pos), "kind": kind})
        pos = target
    total = sum(s["distance"] for s in steps)
    n = len(steps)
    return {
        "algorithm": name,
        "sequence": [s["to"] for s in steps],
        "steps": steps,
        "total": total,
        "jump_total": sum(s["distance"] for s in steps if s["kind"] == "jump"),
        "avg_seek": round(total / n, 2) if n else 0,   # total movement / requests serviced
        "max_seek": max((s["distance"] for s in steps), default=0),
        "moves": n,
    }
