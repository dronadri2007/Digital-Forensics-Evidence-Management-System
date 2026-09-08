import os
import pytest


@pytest.fixture(scope="session")
def has_db() -> bool:
    # Use the same source of truth as the app: pydantic-settings reads a local
    # .env into Settings without exporting it to os.environ, so an env-var-only
    # check would miss a `.env`-supplied DATABASE_URL.
    if os.getenv("DATABASE_URL"):
        return True
    try:
        from app.config import get_settings
        return bool(get_settings().database_url)
    except Exception:
        return False


@pytest.fixture(scope="session")
def engine(has_db):
    if not has_db:
        pytest.skip("DATABASE_URL not set; skipping DB-backed test")
    from app.db import engine as _engine
    return _engine


@pytest.fixture()
def db_session(engine):
    from app.db import SessionLocal
    s = SessionLocal()
    try:
        yield s
    finally:
        s.rollback()
        s.close()


@pytest.fixture(scope="session")
def _seeded(has_db):
    if not has_db:
        pytest.skip("no DATABASE_URL; DB-backed tool tests skipped")
    from sqlalchemy import text
    from app.db import SessionLocal
    from seed import seed_world
    with SessionLocal() as s:
        try:
            n = s.execute(text("SELECT count(*) FROM citizens")).scalar() or 0
        except Exception:
            n = 0
    if n != 1000:
        seed_world.run(drop=True)
    return True


@pytest.fixture()
def db(_seeded):
    from app.db import SessionLocal
    s = SessionLocal()
    try:
        yield s
    finally:
        s.rollback()
        s.close()
