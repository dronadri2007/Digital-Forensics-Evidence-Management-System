"""query_telecom — tower dumps, call logs, subscriber lookups over
`cell_pings`, `call_records`, `phones`. Case-aware: the case_id predicate is
applied to all three; active-case PING_SUPPRESSION markers remove individual
ping rows before a tower dump aggregates. In Plan 02 case_evidence is empty,
so the suppression path is exercised only by unit tests."""
from collections import defaultdict

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.tools._common import parse_ts

_RAW_PINGS = text(
    """
    SELECT phone_number, ping_time, signal_strength_dbm
    FROM cell_pings
    WHERE tower_id = :target
      AND ping_time >= :start AND ping_time <= :end
      AND (case_id IS NULL OR case_id = :case_id)
    """
)

_SUPPRESSIONS = text(
    """
    SELECT payload_json
    FROM case_evidence
    WHERE case_id = :case_id AND evidence_type = 'PING_SUPPRESSION'
    """
)

_CALL_LOG = text(
    """
    SELECT cr.caller_num, cr.receiver_num, cr.start_time, cr.duration_sec, cr.is_sms,
           op.is_prepaid AS other_is_prepaid
    FROM call_records cr
    LEFT JOIN phones op
      ON op.phone_number = CASE WHEN cr.caller_num = :target
                                THEN cr.receiver_num ELSE cr.caller_num END
     AND (op.case_id IS NULL OR op.case_id = :case_id)
    WHERE (cr.caller_num = :target OR cr.receiver_num = :target)
      AND cr.start_time >= :start AND cr.start_time <= :end
      AND (cr.case_id IS NULL OR cr.case_id = :case_id)
    ORDER BY cr.start_time
    """
)

_SUBSCRIBER = text(
    """
    SELECT phone_number, subscriber_name, is_prepaid, citizen_id
    FROM phones
    WHERE phone_number = :target AND (case_id IS NULL OR case_id = :case_id)
    LIMIT 1
    """
)


def _suppressed(phone, ping_time, markers) -> bool:
    """True if this single ping falls inside a PING_SUPPRESSION marker for this phone."""
    for m in markers:
        if m.get("phone_number") != phone:
            continue
        if parse_ts(m["start"]) <= ping_time <= parse_ts(m["end"]):
            return True
    return False


def query_telecom(session: Session, target: str, mode: str, start_time, end_time,
                  *, case_id: "str | None" = None) -> "list[dict] | dict | str":
    start, end = parse_ts(start_time), parse_ts(end_time)
    params = {"target": target, "start": start, "end": end, "case_id": case_id}

    if mode == "tower_dump":
        markers = []
        if case_id:
            markers = [m["payload_json"] for m in
                       session.execute(_SUPPRESSIONS, {"case_id": case_id}).mappings().all()]
        agg = defaultdict(lambda: {"count": 0, "first": None, "last": None,
                                   "min_sig": None, "max_sig": None})
        for r in session.execute(_RAW_PINGS, params).mappings():
            if markers and _suppressed(r["phone_number"], r["ping_time"], markers):
                continue
            a = agg[r["phone_number"]]
            a["count"] += 1
            a["first"] = r["ping_time"] if a["first"] is None else min(a["first"], r["ping_time"])
            a["last"] = r["ping_time"] if a["last"] is None else max(a["last"], r["ping_time"])
            s = r["signal_strength_dbm"]
            a["min_sig"] = s if a["min_sig"] is None else min(a["min_sig"], s)
            a["max_sig"] = s if a["max_sig"] is None else max(a["max_sig"], s)
        out = []
        for phone, a in agg.items():
            out.append({
                "phone_number": phone,
                "first_seen": a["first"].isoformat(),
                "last_seen": a["last"].isoformat(),
                "ping_count": a["count"],
                "min_signal_dbm": a["min_sig"],
                "max_signal_dbm": a["max_sig"],
            })
        out.sort(key=lambda r: r["ping_count"], reverse=True)
        return out

    if mode == "call_log":
        rows = session.execute(_CALL_LOG, params).mappings().all()
        return [
            {
                "caller_num": r["caller_num"],
                "receiver_num": r["receiver_num"],
                "start_time": r["start_time"].isoformat(),
                "duration_sec": r["duration_sec"],
                "is_sms": bool(r["is_sms"]),
                "counterparty_is_prepaid_burner": bool(r["other_is_prepaid"]),
            }
            for r in rows
        ]

    if mode == "subscriber":
        r = session.execute(_SUBSCRIBER, params).mappings().first()
        if not r:
            return "NO MATCH FOUND"
        return {
            "phone_number": r["phone_number"],
            "subscriber_name": r["subscriber_name"],
            "is_prepaid": bool(r["is_prepaid"]),
            "linked_citizen_id": str(r["citizen_id"]) if r["citizen_id"] else None,
        }

    return "NO MATCH FOUND"
