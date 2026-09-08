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


def test_engine_uses_psycopg3_dialect(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@ep-x-pooler.aws.neon.tech/neondb?sslmode=require")
    from app import config, db
    importlib.reload(config)
    config.get_settings.cache_clear()
    importlib.reload(db)
    try:
        assert db.engine.url.drivername == "postgresql+psycopg"
        assert db.engine.url.host == "ep-x-pooler.aws.neon.tech"   # userinfo/host/db preserved by the rewrite
    finally:
        monkeypatch.delenv("DATABASE_URL", raising=False)
        config.get_settings.cache_clear()
