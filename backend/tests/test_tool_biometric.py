import pytest
from sqlalchemy import text

from app.tools.biometric import match_biometrics


def test_unknown_sample_type_returns_sentinel():
    # pure — no DB needed
    assert match_biometrics(None, "retina", "whatever") == "NO MATCH FOUND"


@pytest.mark.slow
def test_exact_fingerprint_hash_matches_its_owner(db):
    row = db.execute(text(
        "SELECT citizen_id, fingerprint_hash FROM criminal_records LIMIT 1")).mappings().first()
    res = match_biometrics(db, "fingerprint", row["fingerprint_hash"])
    assert isinstance(res, dict)
    assert res["match"] is True
    assert res["citizen_id"] == str(row["citizen_id"])
    assert res["confidence"] == 1.0
    assert isinstance(res["priors_summary"], str) and res["priors_summary"]


@pytest.mark.slow
def test_near_fingerprint_within_hamming_6_still_matches(db):
    h = db.execute(text("SELECT fingerprint_hash FROM criminal_records LIMIT 1")).scalar()
    # flip one nibble (1 bit) — still <= 6
    idx = next(i for i, ch in enumerate(h) if ch in "0189")
    flipped = h[:idx] + {"0": "1", "1": "0", "8": "9", "9": "8"}[h[idx]] + h[idx + 1:]
    res = match_biometrics(db, "fingerprint", flipped)
    assert isinstance(res, dict) and res["match"] is True
    assert 0.9 <= res["confidence"] < 1.0


@pytest.mark.slow
def test_random_fingerprint_returns_sentinel(db):
    assert match_biometrics(db, "fingerprint", "0" * 64) == "NO MATCH FOUND"


@pytest.mark.slow
def test_exact_dna_string_matches(db):
    row = db.execute(text(
        "SELECT citizen_id, dna_string FROM criminal_records LIMIT 1")).mappings().first()
    res = match_biometrics(db, "DNA", row["dna_string"])
    assert res["match"] is True and res["citizen_id"] == str(row["citizen_id"])
    assert res["confidence"] >= 0.9


@pytest.mark.slow
def test_dissimilar_dna_returns_sentinel(db):
    assert match_biometrics(db, "dna", "A" * 100) == "NO MATCH FOUND"
