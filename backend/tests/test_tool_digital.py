import json

import pytest
from sqlalchemy import text

from app.tools.digital import pivot_digital_identity

pytestmark = pytest.mark.slow


def test_pivot_by_handle_returns_profile_and_posts(db):
    handle = db.execute(text("SELECT username FROM social_profiles LIMIT 1")).scalar()
    res = pivot_digital_identity(db, handle)
    assert isinstance(res, dict)
    assert any(p["username"].lower() == handle.lower() for p in res["profiles"])
    assert all(set(p) == {"username", "platform", "display_name", "bio",
                          "recovery_email", "is_private", "citizen_id"} for p in res["profiles"])
    json.dumps(res)


def test_pivot_handle_to_citizen_via_breach_email(db):
    row = db.execute(text(
        "SELECT b.leaked_username, sp.citizen_id "
        "FROM breach_dumps b JOIN social_profiles sp "
        "  ON lower(sp.recovery_email) = lower(b.leaked_email) "
        "WHERE sp.citizen_id IS NOT NULL LIMIT 1")).mappings().first()
    if row is None:
        pytest.skip("seed produced no handle->breach->email->citizen chain")
    res = pivot_digital_identity(db, row["leaked_username"])
    assert res["breach_links"]
    assert res["resolved_citizen_id"] == str(row["citizen_id"])


def test_pivot_by_email(db):
    email = db.execute(text("SELECT recovery_email FROM social_profiles LIMIT 1")).scalar()
    res = pivot_digital_identity(db, email)
    assert res["profiles"]
    assert all(p["recovery_email"].lower() == email.lower() for p in res["profiles"])


def test_pivot_by_ip_lists_households(db):
    ip = db.execute(text("SELECT host(wan_ip) FROM households LIMIT 1")).scalar()
    res = pivot_digital_identity(db, ip)
    assert any(h["household_id"] for h in res["linked_households"])


def test_pivot_unknown_handle_all_empty(db):
    res = pivot_digital_identity(db, "zzz_nobody_9999")
    assert res["profiles"] == [] and res["posts"] == [] and res["breach_links"] == []
    assert res["resolved_citizen_id"] is None
