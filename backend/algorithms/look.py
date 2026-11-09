"""LOOK: sweep in one direction up to the LAST request (not the disk end), reverse, sweep back."""
from .common import build_result


def look(head, requests, direction="right"):
    if direction == "right":
        first = sorted(r for r in requests if r >= head)                 # requests == head cost 0
        second = sorted((r for r in requests if r < head), reverse=True)  # after reversing
    else:
        first = sorted((r for r in requests if r <= head), reverse=True)
        second = sorted(r for r in requests if r > head)
    return build_result("LOOK", head, [(r, "seek") for r in first + second])
