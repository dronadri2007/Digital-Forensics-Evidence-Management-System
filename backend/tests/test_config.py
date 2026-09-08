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
