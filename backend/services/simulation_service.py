"""Validation + orchestration. No web code here; algorithms stay in algorithms/."""
from algorithms.look import look
from algorithms.clook import clook

MAX_REQUESTS = 100


def validate(head, requests, min_cyl, max_cyl, direction):
    if min_cyl >= max_cyl:
        raise ValueError("Minimum cylinder must be less than maximum cylinder.")
    if not requests:
        raise ValueError("Enter at least one disk request.")
    if len(requests) > MAX_REQUESTS:
        raise ValueError(f"At most {MAX_REQUESTS} requests are allowed.")
    if not min_cyl <= head <= max_cyl:
        raise ValueError(f"Head position {head} is outside {min_cyl}-{max_cyl}.")
    bad = [r for r in requests if not min_cyl <= r <= max_cyl]
    if bad:
        raise ValueError(f"Requests out of range {min_cyl}-{max_cyl}: {bad}")
    if direction not in ("left", "right"):
        raise ValueError("Direction must be 'left' or 'right'.")


def run(algorithm, head, requests, min_cyl=0, max_cyl=199, direction="right"):
    validate(head, requests, min_cyl, max_cyl, direction)
    fn = {"look": look, "clook": clook}.get(algorithm)
    if fn is None:
        raise ValueError("Unknown algorithm.")
    return fn(head, list(requests), direction)


def compare(head, requests, min_cyl=0, max_cyl=199, direction="right"):
    """Both algorithms receive identical input, so the result is reproducible."""
    a = run("look", head, requests, min_cyl, max_cyl, direction)
    b = run("clook", head, requests, min_cyl, max_cyl, direction)
    diff = round((b["total"] - a["total"]) / a["total"] * 100, 2) if a["total"] else 0.0
    return {"look": a, "clook": b, "diff_percent": diff}
