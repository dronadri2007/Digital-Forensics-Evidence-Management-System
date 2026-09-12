"""match_biometrics — latent print / DNA comparison against `criminal_records`
(~45 rows). No case_id column; argument accepted, unused."""
from rapidfuzz.fuzz import ratio
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.tools._common import hamming_hex

_ALL = text("SELECT citizen_id, priors_summary, fingerprint_hash, dna_string FROM criminal_records")

_FP_MAX_HAMMING = 6
_DNA_MIN_RATIO = 0.90


def match_biometrics(session: Session, sample_type: str, sample_data: str,
                     *, case_id: "str | None" = None) -> "dict | str":
    st = (sample_type or "").strip().lower()
    if st not in ("fingerprint", "dna"):
        return "NO MATCH FOUND"
    rows = session.execute(_ALL).mappings().all()
    sample = (sample_data or "").strip()
    best_row = None
    best_conf = 0.0
    if st == "fingerprint":
        s = sample.lower()
        for r in rows:
            h = hamming_hex(s, r["fingerprint_hash"].lower())
            if h <= _FP_MAX_HAMMING:
                conf = 1.0 - h / 64.0
                if conf > best_conf:
                    best_row, best_conf = r, conf
    else:
        s = sample.upper()
        for r in rows:
            sim = ratio(s, r["dna_string"].upper()) / 100.0
            if sim >= _DNA_MIN_RATIO and sim > best_conf:
                best_row, best_conf = r, sim
    if best_row is None:
        return "NO MATCH FOUND"
    return {
        "match": True,
        "citizen_id": str(best_row["citizen_id"]),
        "confidence": round(best_conf, 3),
        "priors_summary": best_row["priors_summary"],
    }
