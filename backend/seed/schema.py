import psycopg

from app.db import engine
from app.models import Base


def ensure_extensions(conn: psycopg.Connection) -> None:
    try:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
    except psycopg.Error as exc:  # pragma: no cover - infra failure path
        raise RuntimeError(
            "Could not create the pg_trgm extension. AEGIS fuzzy search requires it. "
            f"Underlying error: {exc}"
        ) from exc


def create_all_tables() -> None:
    Base.metadata.create_all(engine)


def drop_all_tables() -> None:
    Base.metadata.drop_all(engine)
