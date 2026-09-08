import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.config import get_settings

_settings = get_settings()

engine = create_engine(_settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def raw_connection() -> psycopg.Connection:
    """Plain psycopg connection for COPY bulk loads."""
    return psycopg.connect(_settings.database_url)
