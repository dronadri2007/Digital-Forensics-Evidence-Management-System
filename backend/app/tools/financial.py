"""scan_financials — card/ATM transaction scan over `financial_transactions`
(+ `bank_accounts` to resolve a citizen). case_id predicate on transactions.
Three target kinds, three separate complete parameterised queries — no SQL
templating."""
import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.tools._common import parse_ts

_ACCOUNTS_FOR_CITIZEN = text("SELECT account_id FROM bank_accounts WHERE citizen_id = :cid")

_BY_ACCOUNTS = text(
    """
    SELECT tx_id, account_id, merchant_name, merchant_category, amount, tx_time,
           atm_id, is_cash_withdrawal, terminal_lat, terminal_lon
    FROM financial_transactions
    WHERE account_id = ANY(:accts)
      AND tx_time >= :start AND tx_time <= :end
      AND (case_id IS NULL OR case_id = :case_id)
    ORDER BY tx_time
    """
)

_BY_ATM = text(
    """
    SELECT tx_id, account_id, merchant_name, merchant_category, amount, tx_time,
           atm_id, is_cash_withdrawal, terminal_lat, terminal_lon
    FROM financial_transactions
    WHERE atm_id = :t
      AND tx_time >= :start AND tx_time <= :end
      AND (case_id IS NULL OR case_id = :case_id)
    ORDER BY tx_time
    """
)

_BY_ACCOUNT = text(
    """
    SELECT tx_id, account_id, merchant_name, merchant_category, amount, tx_time,
           atm_id, is_cash_withdrawal, terminal_lat, terminal_lon
    FROM financial_transactions
    WHERE account_id = :t
      AND tx_time >= :start AND tx_time <= :end
      AND (case_id IS NULL OR case_id = :case_id)
    ORDER BY tx_time
    """
)

_SUSPICIOUS_CATEGORIES = {"HARDWARE", "PHARMACY"}


def _kind(target: str) -> str:
    try:
        uuid.UUID(str(target))
        return "citizen"
    except (ValueError, AttributeError, TypeError):
        return "atm" if str(target).upper().startswith("ATM-") else "account"


def scan_financials(session: Session, target: str, start_time, end_time,
                    *, case_id: "str | None" = None) -> dict:
    start, end = parse_ts(start_time), parse_ts(end_time)
    kind = _kind(target)
    if kind == "citizen":
        accts = [row[0] for row in session.execute(_ACCOUNTS_FOR_CITIZEN, {"cid": str(target)})]
        if not accts:
            return {"transactions": [], "flags": []}
        result = session.execute(
            _BY_ACCOUNTS, {"accts": accts, "start": start, "end": end, "case_id": case_id})
    elif kind == "atm":
        result = session.execute(
            _BY_ATM, {"t": str(target).upper(), "start": start, "end": end, "case_id": case_id})
    else:
        result = session.execute(
            _BY_ACCOUNT, {"t": target, "start": start, "end": end, "case_id": case_id})

    txs = []
    flags = set()
    for r in result.mappings():
        amount = float(r["amount"])
        if r["is_cash_withdrawal"] and amount >= 150:
            flags.add("large_cash_withdrawal")
        if r["merchant_category"] in _SUSPICIOUS_CATEGORIES:
            flags.add("suspicious_category")
        txs.append({
            "tx_id": r["tx_id"],
            "account_id": r["account_id"],
            "merchant_name": r["merchant_name"],
            "merchant_category": r["merchant_category"],
            "amount": amount,
            "tx_time": r["tx_time"].isoformat(),
            "atm_id": r["atm_id"],
            "is_cash_withdrawal": bool(r["is_cash_withdrawal"]),
            "terminal_lat": float(r["terminal_lat"]) if r["terminal_lat"] is not None else None,
            "terminal_lon": float(r["terminal_lon"]) if r["terminal_lon"] is not None else None,
        })
    return {"transactions": txs, "flags": sorted(flags)}
