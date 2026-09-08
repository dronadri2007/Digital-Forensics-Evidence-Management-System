import hashlib
import pytest

pytestmark = pytest.mark.slow

# One fully-literal, order-stable whole-row projection per base-world table.
# Every string here is a hard-coded constant — no interpolation, no user input.
_DIGEST_QUERIES = (
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.household_id), '')) FROM households AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.citizen_id), '')) FROM citizens AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.criminal_id), '')) FROM criminal_records AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.camera_id), '')) FROM cctv_cameras AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.phone_number), '')) FROM phones AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.account_id), '')) FROM bank_accounts AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.plate_number), '')) FROM vehicles AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.username), '')) FROM social_profiles AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.post_id), '')) FROM social_posts AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.breach_id), '')) FROM breach_dumps AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.ping_id), '')) FROM cell_pings AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.cdr_id), '')) FROM call_records AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.sighting_id), '')) FROM cctv_sightings AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.tx_id), '')) FROM financial_transactions AS t",
    "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.anpr_id), '')) FROM anpr_events AS t",
)


def _digest(session) -> str:
    from sqlalchemy import text
    parts = [str(session.execute(text(q)).scalar()) for q in _DIGEST_QUERIES]
    return hashlib.sha256("|".join(parts).encode()).hexdigest()


def test_seed_runs_and_row_counts_are_sane(engine):
    from seed import seed_world
    from app.db import SessionLocal
    from sqlalchemy import text
    summary = seed_world.run(drop=True)
    assert summary["citizens"] == 1000
    assert summary["households"] >= 400
    assert summary["criminal_records"] == 45
    assert 120_000 <= summary["cell_pings"] <= 260_000
    assert summary["cctv_sightings"] > 5_000
    assert summary["financial_transactions"] > 3_000
    assert summary["breach_dumps"] == 600
    assert summary["frozen_scenarios"] == 0

    # bulk_copy now reports the server-side COPY rowcount — cross-check it
    # against an independent SELECT count(*) for a representative few tables.
    with SessionLocal() as s:
        assert s.execute(text("SELECT count(*) FROM citizens")).scalar() == summary["citizens"]
        assert s.execute(text("SELECT count(*) FROM cell_pings")).scalar() == summary["cell_pings"]
        assert s.execute(text("SELECT count(*) FROM breach_dumps")).scalar() == summary["breach_dumps"]


def test_seed_is_deterministic(engine):
    from seed import seed_world
    from app.db import SessionLocal
    seed_world.run(drop=True)
    with SessionLocal() as s:
        d1 = _digest(s)
    seed_world.run(drop=True)
    with SessionLocal() as s:
        d2 = _digest(s)
    assert d1 == d2


def test_pg_trgm_similarity_query_works(engine):
    from seed import seed_world
    from app.db import SessionLocal
    from sqlalchemy import text
    seed_world.run(drop=True)
    with SessionLocal() as s:
        one = s.execute(text("SELECT full_name FROM citizens LIMIT 1")).scalar()
        hits = s.execute(text(
            "SELECT full_name FROM citizens "
            "WHERE similarity(full_name, :q) > 0.3 "
            "ORDER BY similarity(full_name, :q) DESC LIMIT 5"
        ), {"q": one}).all()
    assert len(hits) >= 1
