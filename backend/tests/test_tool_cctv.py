import json

import pytest
from sqlalchemy import text

from app.tools.cctv import search_cctv

pytestmark = pytest.mark.slow


def test_unknown_camera_returns_no_coverage(db):
    assert search_cctv(db, "CAM-999", "2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z") == "NO COVERAGE"


def test_known_camera_returns_sightings_in_window(db):
    cam, t0, t1 = db.execute(text(
        "SELECT camera_id, min(seen_time), max(seen_time) FROM cctv_sightings "
        "WHERE case_id IS NULL GROUP BY camera_id LIMIT 1")).first()
    res = search_cctv(db, cam, t0.isoformat(), t1.isoformat())
    assert res["camera_id"] == cam
    assert isinstance(res["coverage_desc"], str) and res["coverage_desc"]
    assert res["sightings"] and all(
        set(s) == {"seen_time", "detected_height_cm", "clothing_tags",
                   "face_confidence", "citizen_id"} for s in res["sightings"])
    assert all(isinstance(s["face_confidence"], float) for s in res["sightings"])
    json.dumps(res)


def test_clothing_tag_filter(db):
    cam = db.execute(text(
        "SELECT camera_id FROM cctv_sightings WHERE case_id IS NULL LIMIT 1")).scalar()
    tag = db.execute(text(
        "SELECT clothing_tags[1] FROM cctv_sightings "
        "WHERE case_id IS NULL AND array_length(clothing_tags,1) >= 1 LIMIT 1")).scalar()
    res = search_cctv(db, cam, "2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z", [tag.upper()])
    assert all(any(t.lower() == tag.lower() for t in s["clothing_tags"])
               for s in res["sightings"])


def test_known_camera_empty_window_returns_empty_sightings_not_sentinel(db):
    cam = db.execute(text("SELECT camera_id FROM cctv_cameras LIMIT 1")).scalar()
    res = search_cctv(db, cam, "1999-01-01T00:00:00Z", "1999-01-02T00:00:00Z")
    assert res["camera_id"] == cam and res["sightings"] == []
