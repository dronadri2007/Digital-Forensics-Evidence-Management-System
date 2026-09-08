import json

import pytest
from sqlalchemy import text

from app.tools.telecom import query_telecom, _suppressed
from app.tools._common import parse_ts


def test_suppressed_overlap_logic():
    m = [{"phone_number": "+447000", "start": "2026-09-01T22:00:00Z", "end": "2026-09-01T23:00:00Z"}]
    assert _suppressed("+447000", parse_ts("2026-09-01T22:30:00Z"),
                       parse_ts("2026-09-01T22:45:00Z"), m) is True
    assert _suppressed("+447000", parse_ts("2026-09-01T23:30:00Z"),
                       parse_ts("2026-09-01T23:45:00Z"), m) is False
    assert _suppressed("+447999", parse_ts("2026-09-01T22:30:00Z"),
                       parse_ts("2026-09-01T22:45:00Z"), m) is False


@pytest.mark.slow
def test_tower_dump_lists_phones_active_in_window(db):
    tw, t0, t1 = db.execute(text(
        "SELECT tower_id, min(ping_time), max(ping_time) FROM cell_pings "
        "WHERE case_id IS NULL GROUP BY tower_id LIMIT 1")).first()
    rows = query_telecom(db, tw, "tower_dump", t0.isoformat(), t1.isoformat())
    assert isinstance(rows, list) and rows
    assert all(set(r) == {"phone_number", "first_seen", "last_seen",
                          "ping_count", "min_signal_dbm", "max_signal_dbm"} for r in rows)
    assert rows == sorted(rows, key=lambda r: r["ping_count"], reverse=True)
    json.dumps(rows)


@pytest.mark.slow
def test_call_log_for_a_real_number(db):
    num = db.execute(text("SELECT caller_num FROM call_records WHERE case_id IS NULL LIMIT 1")).scalar()
    t0, t1 = db.execute(text(
        "SELECT min(start_time), max(start_time) FROM call_records WHERE caller_num = :n"),
        {"n": num}).first()
    rows = query_telecom(db, num, "call_log", t0.isoformat(), t1.isoformat())
    assert isinstance(rows, list) and rows
    assert all(r["caller_num"] == num or r["receiver_num"] == num for r in rows)
    assert all(isinstance(r["counterparty_is_prepaid_burner"], bool) for r in rows)


@pytest.mark.slow
def test_subscriber_resolves_and_misses(db):
    num = db.execute(text("SELECT phone_number FROM phones WHERE case_id IS NULL LIMIT 1")).scalar()
    res = query_telecom(db, num, "subscriber", "2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z")
    assert res["phone_number"] == num
    assert isinstance(res["is_prepaid"], bool)
    assert query_telecom(db, "+440000000000", "subscriber",
                         "2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z") == "NO MATCH FOUND"


@pytest.mark.slow
def test_bad_mode_returns_sentinel(db):
    assert query_telecom(db, "TOWER-1", "wiretap",
                         "2026-09-01T00:00:00Z", "2026-09-02T00:00:00Z") == "NO MATCH FOUND"
