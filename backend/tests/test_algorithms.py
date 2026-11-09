import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import pytest
from algorithms.look import look
from algorithms.clook import clook
from services import simulation_service as svc

Q = [98, 183, 37, 122, 14, 124, 65, 67]


def test_look_right_sample():
    r = look(53, Q, "right")
    assert r["sequence"] == [65, 67, 98, 122, 124, 183, 37, 14]
    assert r["total"] == 299          # (183-53) + (183-14)


def test_clook_right_sample():
    r = clook(53, Q, "right")
    assert r["sequence"] == [65, 67, 98, 122, 124, 183, 14, 37]
    assert r["jump_total"] == 169     # 183 -> 14
    assert r["total"] == 322          # 130 + 169 + 23


def test_look_left_sample():
    r = look(53, Q, "left")
    assert r["sequence"] == [37, 14, 65, 67, 98, 122, 124, 183]
    assert r["total"] == 39 + 169     # (53-14) + (183-14) = 208


def test_clook_left_sample():
    r = clook(53, Q, "left")
    assert r["sequence"] == [37, 14, 183, 124, 122, 98, 67, 65]
    assert r["jump_total"] == 169 and r["total"] == 39 + 169 + 118


def test_duplicates_and_head_equal_request():
    r = look(50, [50, 50, 60], "right")
    assert r["sequence"] == [50, 50, 60] and r["total"] == 10
    assert len(clook(50, [50, 50, 60], "right")["steps"]) == 3


def test_no_jump_when_all_requests_ahead():
    r = clook(10, [20, 30], "right")
    assert r["jump_total"] == 0 and r["total"] == 20


def test_look_never_visits_disk_end():
    assert max(look(53, Q, "right")["sequence"]) == 183


def test_all_requests_serviced():
    for f in (look, clook):
        for d in ("left", "right"):
            assert sorted(f(53, Q, d)["sequence"]) == sorted(Q)


def test_compare_and_validation():
    c = svc.compare(53, Q)
    assert c["look"]["total"] == 299 and c["clook"]["total"] == 322
    assert c["diff_percent"] == round(23 / 299 * 100, 2)
    for bad in [dict(head=300, requests=[1]), dict(head=5, requests=[]), dict(head=5, requests=[500])]:
        with pytest.raises(ValueError):
            svc.run("look", **bad)
