import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.config import get_settings

_settings = get_settings()

# psycopg (v3) gets the URL as-is; SQLAlchemy needs the dialect+driver spelled out.
_RAW_URL = _settings.database_url
if _RAW_URL.startswith("postgresql+"):
    _SQLALCHEMY_URL = _RAW_URL
elif _RAW_URL.startswith("postgresql://"):
    _SQLALCHEMY_URL = "postgresql+psycopg://" + _RAW_URL[len("postgresql://"):]
elif _RAW_URL.startswith("postgres://"):
    _SQLALCHEMY_URL = "postgresql+psycopg://" + _RAW_URL[len("postgres://"):]
else:
    _SQLALCHEMY_URL = _RAW_URL

engine = create_engine(_SQLALCHEMY_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def raw_connection() -> psycopg.Connection:
    """Plain psycopg (v3) connection for COPY bulk loads — uses the unmodified URL."""
    return psycopg.connect(_RAW_URL)
