"""lookup_vehicle_anpr — registered-vehicle + border-crossing lookup over
`vehicles` + `anpr_events`. case_id predicate on anpr_events. In Plan 02
`cloned_plate_suspected` is always False (base world seeds observed==registered);
the cloned-plate tactic is a Plan 03 injection."""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.tools._common import parse_ts

_VEHICLE = text(
    "SELECT plate_number, make, model, color, registered_citizen_id "
    "FROM vehicles WHERE plate_number = :p"
)

_CROSSINGS = text(
    """
    SELECT seen_time, direction, border_camera_id, observed_make, observed_model
    FROM anpr_events
    WHERE plate_number = :p
      AND (CAST(:start AS timestamptz) IS NULL OR seen_time >= CAST(:start AS timestamptz))
      AND (CAST(:end AS timestamptz) IS NULL OR seen_time <= CAST(:end AS timestamptz))
      AND (case_id IS NULL OR case_id = :case_id)
    ORDER BY seen_time
    """
)


def lookup_vehicle_anpr(session: Session, plate_number: str, start_time=None, end_time=None,
                        *, case_id: "str | None" = None) -> "dict | str":
    v = session.execute(_VEHICLE, {"p": plate_number}).mappings().first()
    start = parse_ts(start_time) if start_time else None
    end = parse_ts(end_time) if end_time else None
    rows = session.execute(
        _CROSSINGS, {"p": plate_number, "start": start, "end": end, "case_id": case_id}
    ).mappings().all()

    crossings = [
        {
            "seen_time": r["seen_time"].isoformat(),
            "direction": r["direction"],
            "border_camera_id": r["border_camera_id"],
            "observed_make": r["observed_make"],
            "observed_model": r["observed_model"],
        }
        for r in rows
    ]
    if v is None and not crossings:
        return "NO MATCH FOUND"

    registered = None
    cloned = False
    if v is not None:
        registered = {
            "make": v["make"],
            "model": v["model"],
            "color": v["color"],
            "owner_citizen_id": str(v["registered_citizen_id"]) if v["registered_citizen_id"] else None,
        }
        cloned = any(
            c["observed_make"] != v["make"] or c["observed_model"] != v["model"]
            for c in crossings
        )
    return {"registered": registered, "crossings": crossings, "cloned_plate_suspected": cloned}
