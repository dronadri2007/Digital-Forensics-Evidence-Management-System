import numpy as np
from seed import geometry


def test_place_towers_returns_six_on_grid():
    towers = geometry.place_towers()
    assert len(towers) == 6
    assert all(0 <= t["lat"] <= 2000 and 0 <= t["lon"] <= 2000 for t in towers)
    assert {t["tower_id"] for t in towers} == {f"TOWER-{i}" for i in range(1, 7)}


def test_place_cameras_is_deterministic():
    a = geometry.place_cameras(np.random.default_rng(42))
    b = geometry.place_cameras(np.random.default_rng(42))
    assert a == b
    assert len(a) == 30


def test_nearest_tower_picks_closest():
    towers = geometry.place_towers()
    t = geometry.nearest_tower(towers[0]["lat"], towers[0]["lon"], towers)
    assert t == towers[0]["tower_id"]


def test_camera_coverage_true_near_a_camera_false_far():
    cams = geometry.place_cameras(np.random.default_rng(1))
    c = cams[0]
    assert geometry.has_camera_coverage(c["lat"], c["lon"], cams) is True
    assert geometry.has_camera_coverage(-500, -500, cams) is False
