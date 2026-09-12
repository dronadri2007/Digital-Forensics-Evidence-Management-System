"""search_civil_registry — fuzzy identity/address lookup over `citizens`.

Tables: citizens (+ criminal_records existence flag). No case_id column on
citizens, so the case_id argument is accepted for interface uniformity but
unused. pg_trgm `similarity()` drives ranking (threshold 0.3)."""
from sqlalchemy import text
from sqlalchemy.orm import Session

_SQL = text(
    """
    SELECT c.citizen_id, c.full_name, c.aliases, c.dob, c.gender, c.address,
           c.address_updated_year, c.legal_status, c.phone_number, c.registered_plate,
           (c.national_id IS NOT NULL) AS national_id_present,
           EXISTS (SELECT 1 FROM criminal_records cr WHERE cr.citizen_id = c.citizen_id)
               AS has_criminal_record,
           GREATEST(
               similarity(c.full_name, :q),
               similarity(c.address, :q),
               similarity(array_to_string(c.aliases, ' '), :q)
           ) AS score
    FROM citizens c
    WHERE (:mode IN ('name', 'auto')    AND similarity(c.full_name, :q) > 0.3)
       OR (:mode IN ('address', 'auto') AND similarity(c.address, :q) > 0.3)
       OR (:mode = 'auto' AND similarity(array_to_string(c.aliases, ' '), :q) > 0.3)
    ORDER BY score DESC
    LIMIT 25
    """
)


def search_civil_registry(session: Session, query: str, search_type: str = "auto",
                          *, case_id: "str | None" = None) -> list[dict]:
    mode = search_type if search_type in ("auto", "name", "address") else "auto"
    rows = session.execute(_SQL, {"q": query, "mode": mode}).mappings().all()
    return [
        {
            "citizen_id": str(r["citizen_id"]),
            "full_name": r["full_name"],
            "aliases": list(r["aliases"] or []),
            "dob": r["dob"].isoformat(),
            "gender": r["gender"],
            "address": r["address"],
            "address_updated_year": r["address_updated_year"],
            "legal_status": r["legal_status"],
            "national_id_present": bool(r["national_id_present"]),
            "has_criminal_record": bool(r["has_criminal_record"]),
            "phone_number": r["phone_number"],
            "registered_plate": r["registered_plate"],
            "match_score": round(float(r["score"] or 0.0), 3),
        }
        for r in rows
    ]
