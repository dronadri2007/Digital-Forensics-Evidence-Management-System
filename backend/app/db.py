import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.config import get_settings


def sqlalchemy_url(raw: str) -> str:
    """Rewrite a raw DATABASE_URL into an explicit SQLAlchemy dialect+driver URL.

    Pure function, no I/O — pass through anything already carrying a
    ``postgresql+<driver>`` prefix, promote bare ``postgresql://`` and the
    Heroku-style ``postgres://`` to ``postgresql+psycopg://``, and leave
    anything else untouched. Only a leading scheme token is rewritten, so a
    password that happens to contain ``postgresql://`` is never corrupted.
    """
    if raw.startswith("postgresql+"):
        return raw
    if raw.startswith("postgresql://"):
        return "postgresql+psycopg://" + raw[len("postgresql://"):]
    if raw.startswith("postgres://"):
        return "postgresql+psycopg://" + raw[len("postgres://"):]
    return raw


# psycopg (v3) gets the URL as-is; SQLAlchemy needs the dialect+driver spelled
# out. When no DATABASE_URL is configured (e.g. the offline unit-test run) the
# engine/session are left as None so importing this module — and the pure
# sqlalchemy_url() helper — never hard-fails; anything that actually touches the
# DB still needs a real URL.
try:
    _RAW_URL: str | None = get_settings().database_url
except Exception:  # pragma: no cover - exercised only without a configured URL
    _RAW_URL = None

if _RAW_URL:
    engine = create_engine(sqlalchemy_url(_RAW_URL), pool_pre_ping=True, future=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)
else:  # pragma: no cover
    engine = None
    SessionLocal = None


def raw_connection() -> psycopg.Connection:
    """Plain psycopg (v3) connection for COPY bulk loads — uses the unmodified URL."""
    if not _RAW_URL:
        raise RuntimeError("DATABASE_URL is not configured; cannot open a raw connection.")
    return psycopg.connect(_RAW_URL)
