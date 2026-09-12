import json

import pytest
from sqlalchemy import text

from app.tools.financial import scan_financials

pytestmark = pytest.mark.slow


def test_scan_by_account_id(db):
    acct = db.execute(text(
        "SELECT account_id FROM financial_transactions WHERE case_id IS NULL LIMIT 1")).scalar()
    res = scan_financials(db, acct, "2026-09-01T00:00:00Z", "2026-09-08T23:59:59Z")
    assert isinstance(res, dict) and res["transactions"]
    assert all(t["account_id"] == acct for t in res["transactions"])
    assert res["transactions"] == sorted(res["transactions"], key=lambda t: t["tx_time"])
    assert all(isinstance(t["amount"], float) for t in res["transactions"])
    json.dumps(res)


def test_scan_by_citizen_id_aggregates_their_accounts(db):
    cid = db.execute(text(
        "SELECT ba.citizen_id FROM bank_accounts ba "
        "JOIN financial_transactions ft ON ft.account_id = ba.account_id LIMIT 1")).scalar()
    res = scan_financials(db, str(cid), "2026-09-01T00:00:00Z", "2026-09-08T23:59:59Z")
    assert res["transactions"]


def test_scan_by_atm_id(db):
    atm = db.execute(text(
        "SELECT atm_id FROM financial_transactions WHERE atm_id IS NOT NULL LIMIT 1")).scalar()
    res = scan_financials(db, atm, "2026-09-01T00:00:00Z", "2026-09-08T23:59:59Z")
    assert res["transactions"] and all(t["atm_id"] == atm for t in res["transactions"])


def test_unknown_target_returns_empty_dict_not_sentinel(db):
    res = scan_financials(db, "AC0000000000", "2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z")
    assert res == {"transactions": [], "flags": []}
