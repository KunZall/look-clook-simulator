"""C-LOOK: sweep in one direction to the last request, JUMP to the first request at the
opposite end, and continue in the SAME direction (never reverse)."""
from .common import build_result


def clook(head, requests, direction="right"):
    if direction == "right":
        first = sorted(r for r in requests if r >= head)
        rest = sorted(r for r in requests if r < head)               # served ascending after jump
    else:
        first = sorted((r for r in requests if r <= head), reverse=True)
        rest = sorted((r for r in requests if r > head), reverse=True)
    moves = [(r, "seek") for r in first]
    if rest:
        moves.append((rest[0], "jump"))      # circular jump, distance counted separately
        moves += [(r, "seek") for r in rest[1:]]
    return build_result("C-LOOK", head, moves)
