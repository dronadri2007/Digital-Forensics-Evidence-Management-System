import hashlib
import pytest

pytestmark = pytest.mark.slow


def _digest(session) -> str:
    from sqlalchemy import text
    rows = session.execute(text(
        "SELECT full_name, address, coalesce(national_id, 'none') AS nid "
        "FROM citizens ORDER BY full_name, address LIMIT 400"
    )).all()
    return hashlib.sha256(repr(rows).encode()).hexdigest()


def test_seed_runs_and_row_counts_are_sane(engine):
    from seed import seed_world
    summary = seed_world.run(drop=True)
    assert summary["citizens"] == 1000
    assert summary["households"] >= 400
    assert summary["criminal_records"] == 45
    assert 120_000 <= summary["cell_pings"] <= 260_000
    assert summary["cctv_sightings"] > 5_000
    assert summary["financial_transactions"] > 3_000
    assert summary["breach_dumps"] == 600
    assert summary["frozen_scenarios"] == 0


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
