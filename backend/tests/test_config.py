import importlib
import pytest


def test_settings_reads_database_url(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@host/db?sslmode=require")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:5173,https://x.vercel.app")
    from app import config
    importlib.reload(config)
    s = config.get_settings()
    assert s.database_url.startswith("postgresql://")
    assert "https://x.vercel.app" in s.allowed_origins_list


def test_settings_missing_database_url_raises(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    from app import config
    importlib.reload(config)
    config.get_settings.cache_clear()
    with pytest.raises(Exception):
        config.get_settings()


def test_sqlalchemy_url_rewrites_to_psycopg3_dialect():
    from app.db import sqlalchemy_url

    # bare postgresql:// is promoted to the explicit psycopg driver
    assert sqlalchemy_url("postgresql://u:p@h/db") == "postgresql+psycopg://u:p@h/db"
    # Heroku-style postgres:// is promoted too
    assert sqlalchemy_url("postgres://u:p@h/db") == "postgresql+psycopg://u:p@h/db"
    # an already-explicit dialect+driver URL passes through untouched
    assert sqlalchemy_url("postgresql+psycopg://u:p@h/db") == "postgresql+psycopg://u:p@h/db"
    # a non-postgres URL is returned unchanged
    assert sqlalchemy_url("sqlite:///local.db") == "sqlite:///local.db"
    # only the leading scheme token is rewritten — a password containing the
    # substring "postgresql://" must not be corrupted
    weird = "postgresql://u:postgresql://@ep-x-pooler.aws.neon.tech/neondb?sslmode=require"
    assert sqlalchemy_url(weird) == (
        "postgresql+psycopg://u:postgresql://@ep-x-pooler.aws.neon.tech/neondb?sslmode=require"
    )
