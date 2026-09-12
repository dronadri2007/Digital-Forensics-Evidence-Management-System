import json

import pytest
from sqlalchemy import text

from app.tools.anpr import lookup_vehicle_anpr

pytestmark = pytest.mark.slow


def test_lookup_registered_vehicle_with_crossings(db):
    plate = db.execute(text(
        "SELECT v.plate_number FROM vehicles v "
        "JOIN anpr_events a ON a.plate_number = v.plate_number LIMIT 1")).scalar()
    res = lookup_vehicle_anpr(db, plate)
    assert res["registered"] is not None
    assert set(res["registered"]) == {"make", "model", "color", "owner_citizen_id"}
    assert res["crossings"]
    assert res["cloned_plate_suspected"] is False  # base world: observed == registered
    json.dumps(res)


def test_lookup_unknown_plate_returns_sentinel(db):
    assert lookup_vehicle_anpr(db, "ZZ99 ZZZ") == "NO MATCH FOUND"


def test_time_window_filters_crossings(db):
    plate, t0 = db.execute(text(
        "SELECT plate_number, min(seen_time) FROM anpr_events "
        "WHERE case_id IS NULL GROUP BY plate_number LIMIT 1")).first()
    res = lookup_vehicle_anpr(db, plate, start_time=t0.isoformat(), end_time=t0.isoformat())
    assert all(c["seen_time"] == t0.isoformat() for c in res["crossings"])
