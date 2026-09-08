"""search_cctv — camera-window sighting search over `cctv_cameras` +
`cctv_sightings`. case_id predicate on sightings only. Unknown camera →
"NO COVERAGE"; known camera with no sightings → sightings: []."""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.tools._common import parse_ts

_CAM = text("SELECT camera_id, coverage_desc FROM cctv_cameras WHERE camera_id = :cam")

_SIGHT = text(
    """
    SELECT seen_time, detected_height_cm, clothing_tags, face_confidence, citizen_id
    FROM cctv_sightings
    WHERE camera_id = :cam
      AND seen_time >= :start AND seen_time <= :end
      AND (case_id IS NULL OR case_id = :case_id)
    ORDER BY seen_time
    """
)


def search_cctv(session: Session, camera_id: str, start_time, end_time,
                filter_tags: "list[str] | None" = None, *, case_id: "str | None" = None) -> "dict | str":
    cam = session.execute(_CAM, {"cam": camera_id}).mappings().first()
    if not cam:
        return "NO COVERAGE"
    start, end = parse_ts(start_time), parse_ts(end_time)
    rows = session.execute(
        _SIGHT, {"cam": camera_id, "start": start, "end": end, "case_id": case_id}
    ).mappings().all()
    wanted = {t.lower() for t in (filter_tags or [])}
    sightings = []
    for r in rows:
        tags = list(r["clothing_tags"] or [])
        if wanted and not (wanted & {t.lower() for t in tags}):
            continue
        sightings.append({
            "seen_time": r["seen_time"].isoformat(),
            "detected_height_cm": r["detected_height_cm"],
            "clothing_tags": tags,
            "face_confidence": float(r["face_confidence"]),
            "citizen_id": str(r["citizen_id"]) if r["citizen_id"] else None,
        })
    return {"camera_id": camera_id, "coverage_desc": cam["coverage_desc"], "sightings": sightings}
