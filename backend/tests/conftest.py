import os
import pytest


@pytest.fixture(scope="session")
def has_db() -> bool:
    return bool(os.getenv("DATABASE_URL"))


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
