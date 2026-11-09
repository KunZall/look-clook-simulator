from typing import List, Literal
from pydantic import BaseModel


class SimInput(BaseModel):
    head: int
    requests: List[int]
    min_cyl: int = 0
    max_cyl: int = 199
    direction: Literal["left", "right"] = "right"


class RunInput(SimInput):
    algorithm: Literal["look", "clook"]
