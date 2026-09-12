import json

import pytest
from sqlalchemy import text

from app.tools.registry import search_civil_registry

pytestmark = pytest.mark.slow


def test_search_by_partial_name_returns_scored_matches(db):
    real_name = db.execute(text("SELECT full_name FROM citizens LIMIT 1")).scalar()
    token = real_name.split()[-1]  # surname
    rows = search_civil_registry(db, token, "name")
    assert isinstance(rows, list) and rows
    assert any(token.lower() in r["full_name"].lower() for r in rows)
    assert all(0.0 <= r["match_score"] <= 1.0 for r in rows)
    assert rows == sorted(rows, key=lambda r: r["match_score"], reverse=True)
    assert len(rows) <= 25


def test_search_result_is_fully_json_serialisable(db):
    name = db.execute(text("SELECT full_name FROM citizens LIMIT 1")).scalar()
    rows = search_civil_registry(db, name.split()[0], "name")
    json.dumps(rows)  # must not raise
    r = rows[0]
    assert isinstance(r["citizen_id"], str)
    assert isinstance(r["dob"], str)
    assert isinstance(r["national_id_present"], bool)
    assert isinstance(r["has_criminal_record"], bool)


def test_search_by_address(db):
    addr = db.execute(text("SELECT address FROM citizens LIMIT 1")).scalar()
    token = addr.split()[0]
    rows = search_civil_registry(db, token, "address")
    assert isinstance(rows, list)


def test_search_no_match_returns_empty_list(db):
    assert search_civil_registry(db, "Zzxqwv Nonexistent Qqq", "name") == []


def test_has_criminal_record_flag_is_accurate(db):
    cid = db.execute(text("SELECT citizen_id FROM criminal_records LIMIT 1")).scalar()
    name = db.execute(text("SELECT full_name FROM citizens WHERE citizen_id = :c"),
                      {"c": cid}).scalar()
    rows = search_civil_registry(db, name, "name")
    hit = next((r for r in rows if r["citizen_id"] == str(cid)), None)
    assert hit is not None and hit["has_criminal_record"] is True
