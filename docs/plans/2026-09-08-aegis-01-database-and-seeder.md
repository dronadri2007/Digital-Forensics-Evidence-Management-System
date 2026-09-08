# AEGIS Plan 01 — Database Schema & World Seeder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the AEGIS backend skeleton and a deterministic seeder that populates a Neon PostgreSQL database with the 1,000-citizen town of Ashwick plus 7 days of telemetry (~25 MB), runnable with one command.

**Architecture:** FastAPI project skeleton with SQLAlchemy 2.0 declarative models as the single schema source of truth. A pure-Python, RNG-seeded pipeline (`numpy` + `Faker`) generates the base world in memory, then bulk-loads it with PostgreSQL `COPY` via `psycopg` 3. All gameplay/crime data is added later by Plan 03; this plan produces only the immutable base world. Determinism is a hard requirement: same `RNG_SEED` ⇒ byte-identical rows.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy 2.0, `psycopg[binary]` 3.x, `numpy`, `Faker`, `pydantic-settings`, `pytest`. PostgreSQL 16 on Neon with the `pg_trgm` extension.

**Spec:** `docs/design/aegis-design.md` (sections 2, 3, 4, 15)

## Global Constraints

- Python version floor: **3.11** (`python --version` on the dev machine is 3.11.0).
- Database: **PostgreSQL 16 on Neon**, connection via the **pooled** `DATABASE_URL` (`postgresql://...-pooler...neon.tech/...?sslmode=require`).
- The `pg_trgm` extension **must** be creatable; the seeder hard-fails if `CREATE EXTENSION IF NOT EXISTS pg_trgm` raises.
- Determinism: `RNG_SEED = 42` for both `numpy` (`np.random.default_rng(42)`) and `Faker` (`Faker.seed(42)`, one shared `Faker` instance). Re-running the seeder produces identical data.
- Population constants (verbatim from spec §4.1): `POP = 1000`; demographic ratios SOLITARY 0.35, COUPLE 0.25, NUCLEAR 0.30, HMO 0.10; employment ratios DAY 0.45, SWING 0.18, GRAVEYARD 0.11, UNEMPLOYED 0.12, RETIRED 0.14; ghosts 0.08 (80 citizens `national_id = NULL`); criminal records 0.045 (45 citizens); stale addresses 0.25 (250 citizens); `PING_INTERVAL_MIN = 30`; towers 6 (`TOWER-1`..`TOWER-6`); CCTV cameras 30 (`CAM-01`..`CAM-30`); simulation window **7 days**, grid **2000 m × 2000 m**.
- SQL: never build queries by interpolating values into strings. Use bound parameters (`cur.execute(sql, params)` / SQLAlchemy `text(...)` with `:name`) and `psycopg.sql.Identifier` for dynamic table/column names. Bulk load uses `COPY` with identifier composition only.
- Money is stored as `NUMERIC` and handled in Python as `decimal.Decimal`, never `float`.
- All timestamps are timezone-aware UTC (`TIMESTAMPTZ`, `datetime` with `tzinfo=timezone.utc`).
- No secrets in the repo. `.env` is git-ignored; `.env.example` is committed.
- Every task ends with a passing test run and a commit. TDD: write the failing test first (superpowers:test-driven-development).

---

## File Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py               # pydantic-settings Settings: DATABASE_URL, GEMINI_API_KEY (optional here), ALLOWED_ORIGINS
│   ├── db.py                   # SQLAlchemy engine + SessionLocal + psycopg raw-connection helper
│   └── models/
│       ├── __init__.py         # imports all models so Base.metadata is complete; exports Base
│       ├── base.py             # DeclarativeBase subclass `Base`
│       ├── world.py            # Household, Citizen, CriminalRecord, Phone, Vehicle, CctvCamera, BankAccount, SocialProfile
│       ├── telemetry.py        # CellPing, CallRecord, CctvSighting, FinancialTransaction, AnprEvent, SocialPost, BreachDump
│       └── case.py             # Case, CaseEvidence, WitnessReport, InvestigationLog
├── seed/
│   ├── __init__.py
│   ├── constants.py            # all tunable knobs from Global Constraints
│   ├── schema.py               # ensure_extensions, create_all_tables, drop_all_tables
│   ├── geometry.py             # pure: grid, tower/camera placement, household coordinates, nearest-tower
│   ├── population.py           # pure: household + citizen allocation, ghost/criminal/stale/plate/phone assignment
│   ├── routines.py             # pure: per-citizen 7-day routine → telemetry row dicts
│   ├── scenarios.py            # load_frozen_scenarios(): reads scenarios/*.json if present, else warns and returns []
│   └── seed_world.py           # orchestration + COPY bulk load + `python -m seed.seed_world` entrypoint
├── scenarios/                  # empty for now; Plan 03 populates tier1..tier4 JSON
│   └── .gitkeep
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # fixtures: has_db, engine, db_session
│   ├── test_config.py
│   ├── test_models_schema.py
│   ├── test_geometry.py
│   ├── test_population.py
│   ├── test_routines.py
│   └── test_seed_integration.py
├── requirements.txt
├── .env.example
└── pytest.ini
```

**Responsibilities:**
- `seed/geometry.py`, `seed/population.py`, `seed/routines.py` are **pure** — no DB, no I/O, no `datetime.now()`. They take an `rng` / fixed base date and return plain dicts/lists. This is what unit tests exercise.
- `seed/seed_world.py` is the only module that touches the database. It calls the pure builders, then writes with `COPY`.
- Models are mechanical translations of the DDL in spec §3. They carry no business logic.

---

## Task 1: Project skeleton, config, and DB connection

**Files:**
- Create: `backend/requirements.txt`, `backend/.env.example`, `backend/pytest.ini`
- Create: `backend/app/__init__.py`, `backend/app/config.py`, `backend/app/db.py`
- Create: `backend/seed/__init__.py`, `backend/seed/constants.py`
- Create: `backend/tests/__init__.py`, `backend/tests/conftest.py`, `backend/tests/test_config.py`
- Create: `backend/scenarios/.gitkeep`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `app.config.Settings` — pydantic-settings model with fields `database_url: str`, `gemini_api_key: str = ""`, `allowed_origins: str = "http://localhost:5173"`, plus property `allowed_origins_list -> list[str]`. `get_settings() -> Settings` (lru_cached).
  - `app.db.engine` — SQLAlchemy `Engine` (from `get_settings().database_url`, `pool_pre_ping=True`).
  - `app.db.SessionLocal` — `sessionmaker[Session]`.
  - `app.db.raw_connection() -> psycopg.Connection` — `psycopg.connect(settings.database_url)` for `COPY` bulk loads.
  - `seed.constants` — module-level names exactly as listed in Global Constraints (`POP`, `RNG_SEED`, `DEMOGRAPHIC_RATIOS`, `EMPLOYMENT_RATIOS`, `GHOST_RATE`, `CRIMINAL_RATE`, `STALE_ADDRESS_RATE`, `PING_INTERVAL_MIN`, `TOWER_IDS`, `CAMERA_IDS`, `ANPR_IDS`, `SIM_DAYS`, `GRID_METERS`, `SIM_START`, `BULK_BATCH`).

- [ ] **Step 1: Write `requirements.txt`**

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
SQLAlchemy==2.0.36
psycopg[binary]==3.2.3
pydantic-settings==2.7.0
numpy==2.2.1
Faker==33.1.0
python-dotenv==1.0.1
pytest==8.3.4
```

- [ ] **Step 2: Write `.env.example`**

```
# Neon pooled connection string
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
# Not needed until Plan 04
GEMINI_API_KEY=
# Comma-separated; frontend dev server + deployed Vercel domain
ALLOWED_ORIGINS=http://localhost:5173
```

- [ ] **Step 3: Write `pytest.ini`**

```ini
[pytest]
testpaths = tests
markers =
    slow: integration tests that hit the real database
filterwarnings =
    ignore::DeprecationWarning
```

- [ ] **Step 4: Write the failing test — `tests/test_config.py`**

```python
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


def test_settings_missing_database_url_raises(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    from app import config
    importlib.reload(config)
    config.get_settings.cache_clear()
    with pytest.raises(Exception):
        config.get_settings()
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_config.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.config'`

- [ ] **Step 6: Write `app/config.py`**

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    gemini_api_key: str = ""
    allowed_origins: str = "http://localhost:5173"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 7: Write `app/db.py`**

```python
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
```

- [ ] **Step 8: Write `seed/constants.py`**

```python
from datetime import datetime, timezone

RNG_SEED = 42
POP = 1000
SIM_DAYS = 7
SIM_START = datetime(2026, 9, 1, 0, 0, tzinfo=timezone.utc)
GRID_METERS = 2000
PING_INTERVAL_MIN = 30

DEMOGRAPHIC_RATIOS = {"SOLITARY": 0.35, "COUPLE": 0.25, "NUCLEAR": 0.30, "HMO": 0.10}
EMPLOYMENT_RATIOS = {"DAY": 0.45, "SWING": 0.18, "GRAVEYARD": 0.11, "UNEMPLOYED": 0.12, "RETIRED": 0.14}

GHOST_RATE = 0.08
CRIMINAL_RATE = 0.045
STALE_ADDRESS_RATE = 0.25

TOWER_IDS = [f"TOWER-{i}" for i in range(1, 7)]
CAMERA_IDS = [f"CAM-{i:02d}" for i in range(1, 31)]
ANPR_IDS = ["ANPR-N", "ANPR-E", "ANPR-S", "ANPR-W"]

BULK_BATCH = 5000
```

- [ ] **Step 9: Write `tests/conftest.py`**

```python
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
```

- [ ] **Step 10: Create empty package files and `scenarios/.gitkeep`**

`backend/app/__init__.py`, `backend/seed/__init__.py`, `backend/tests/__init__.py` — all empty. `backend/scenarios/.gitkeep` — empty.

- [ ] **Step 11: Run tests to verify they pass**

Run: `cd backend && python -m pip install -r requirements.txt && python -m pytest tests/test_config.py -v`
Expected: PASS (2 passed)

- [ ] **Step 12: Commit**

```bash
git add backend/
git commit -m "feat(backend): project skeleton, settings, db connection, seed constants"
```

---

## Task 2: World models (8 base-world tables)

**Files:**
- Create: `backend/app/models/base.py`, `backend/app/models/world.py`, `backend/app/models/__init__.py`
- Test: `backend/tests/test_models_schema.py`

**Interfaces:**
- Consumes: `app.db.engine`.
- Produces (SQLAlchemy 2.0 mapped classes; column names match spec §3.2 exactly):
  - `Base` (from `app.models.base`) — `DeclarativeBase` subclass.
  - `Household(household_id: uuid, address: str, lat: float, lon: float, household_type: str, wan_ip: str, nearest_tower_id: str)`
  - `Citizen(citizen_id: uuid, national_id: str|None, full_name: str, aliases: list[str], dob: date, gender: str, address: str, address_updated_year: int, legal_status: str, household_id: uuid, occupation: str, workplace_name: str|None, shift_pattern: str, is_unemployed: bool, phone_number: str|None, registered_plate: str|None, photo_url: str|None)`
  - `CriminalRecord(criminal_id: uuid, citizen_id: uuid, priors_summary: str, fingerprint_hash: str, dna_string: str)`
  - `Phone(phone_number: str [pk], imei: str, citizen_id: uuid|None, subscriber_name: str, is_prepaid: bool, case_id: uuid|None)`
  - `Vehicle(plate_number: str [pk], make: str, model: str, color: str, registered_citizen_id: uuid|None)`
  - `CctvCamera(camera_id: str [pk], lat: float, lon: float, coverage_desc: str)`
  - `BankAccount(account_id: str [pk], citizen_id: uuid)`
  - `SocialProfile(username: str [pk], platform: str, display_name: str, bio: str, recovery_email: str, citizen_id: uuid|None, is_private: bool)`
  - `app.models.__init__` re-exports `Base` and every model class.

- [ ] **Step 1: Write the failing test — `tests/test_models_schema.py`**

```python
import pytest
from app.models import Base


def test_base_world_tables_registered():
    names = set(Base.metadata.tables.keys())
    expected = {
        "households", "citizens", "criminal_records", "phones",
        "vehicles", "cctv_cameras", "bank_accounts", "social_profiles",
    }
    assert expected.issubset(names)


def test_citizen_columns_match_spec():
    cols = set(Base.metadata.tables["citizens"].columns.keys())
    expected = {
        "citizen_id", "national_id", "full_name", "aliases", "dob", "gender",
        "address", "address_updated_year", "legal_status", "household_id",
        "occupation", "workplace_name", "shift_pattern", "is_unemployed",
        "phone_number", "registered_plate", "photo_url",
    }
    assert cols == expected


def test_criminal_records_is_small_table_shape():
    cols = set(Base.metadata.tables["criminal_records"].columns.keys())
    assert cols == {"criminal_id", "citizen_id", "priors_summary", "fingerprint_hash", "dna_string"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_models_schema.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.models'`

- [ ] **Step 3: Write `app/models/base.py`**

```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

- [ ] **Step 4: Write `app/models/world.py`**

```python
import uuid
from datetime import date

from sqlalchemy import String, Integer, Boolean, Float, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY, INET
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Household(Base):
    __tablename__ = "households"
    household_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    address: Mapped[str] = mapped_column(String(256))
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    household_type: Mapped[str] = mapped_column(String(16))
    wan_ip: Mapped[str] = mapped_column(INET)
    nearest_tower_id: Mapped[str] = mapped_column(String(16))


class Citizen(Base):
    __tablename__ = "citizens"
    citizen_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    national_id: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(128))
    aliases: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list)
    dob: Mapped[date] = mapped_column(Date)
    gender: Mapped[str] = mapped_column(String(16))
    address: Mapped[str] = mapped_column(String(256))
    address_updated_year: Mapped[int] = mapped_column(Integer)
    legal_status: Mapped[str] = mapped_column(String(16), default="ACTIVE")
    household_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("households.household_id"))
    occupation: Mapped[str] = mapped_column(String(64))
    workplace_name: Mapped[str | None] = mapped_column(String(96), nullable=True)
    shift_pattern: Mapped[str] = mapped_column(String(16))
    is_unemployed: Mapped[bool] = mapped_column(Boolean, default=False)
    phone_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    registered_plate: Mapped[str | None] = mapped_column(String(16), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(256), nullable=True)


class CriminalRecord(Base):
    __tablename__ = "criminal_records"
    criminal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("citizens.citizen_id"))
    priors_summary: Mapped[str] = mapped_column(Text)
    fingerprint_hash: Mapped[str] = mapped_column(String(64))
    dna_string: Mapped[str] = mapped_column(String(120))


class Phone(Base):
    __tablename__ = "phones"
    phone_number: Mapped[str] = mapped_column(String(32), primary_key=True)
    imei: Mapped[str] = mapped_column(String(20))
    citizen_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("citizens.citizen_id"), nullable=True)
    subscriber_name: Mapped[str] = mapped_column(String(128))
    is_prepaid: Mapped[bool] = mapped_column(Boolean, default=False)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class Vehicle(Base):
    __tablename__ = "vehicles"
    plate_number: Mapped[str] = mapped_column(String(16), primary_key=True)
    make: Mapped[str] = mapped_column(String(32))
    model: Mapped[str] = mapped_column(String(32))
    color: Mapped[str] = mapped_column(String(24))
    registered_citizen_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("citizens.citizen_id"), nullable=True)


class CctvCamera(Base):
    __tablename__ = "cctv_cameras"
    camera_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    coverage_desc: Mapped[str] = mapped_column(String(96))


class BankAccount(Base):
    __tablename__ = "bank_accounts"
    account_id: Mapped[str] = mapped_column(String(24), primary_key=True)
    citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("citizens.citizen_id"))


class SocialProfile(Base):
    __tablename__ = "social_profiles"
    username: Mapped[str] = mapped_column(String(48), primary_key=True)
    platform: Mapped[str] = mapped_column(String(16))
    display_name: Mapped[str] = mapped_column(String(96))
    bio: Mapped[str] = mapped_column(String(280), default="")
    recovery_email: Mapped[str] = mapped_column(String(128))
    citizen_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("citizens.citizen_id"), nullable=True)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
```

> Note: `Phone.case_id` references `cases.case_id`, defined in Task 3. `Base.metadata.create_all` resolves cross-file FKs as long as `app.models.__init__` imports every module (Step 5). `test_models_schema.py` in this task only inspects metadata, never calls `create_all`, so it passes before Task 3 exists.

- [ ] **Step 5: Write `app/models/__init__.py`**

```python
from app.models.base import Base
from app.models.world import (
    Household, Citizen, CriminalRecord, Phone, Vehicle,
    CctvCamera, BankAccount, SocialProfile,
)

__all__ = [
    "Base", "Household", "Citizen", "CriminalRecord", "Phone", "Vehicle",
    "CctvCamera", "BankAccount", "SocialProfile",
]
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_models_schema.py -v`
Expected: PASS (3 passed)

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/ backend/tests/test_models_schema.py
git commit -m "feat(backend): world models (households, citizens, criminal records, phones, vehicles, cctv, accounts, social profiles)"
```

---

## Task 3: Telemetry & case models + `pg_trgm` bootstrap + full `create_all`

**Files:**
- Create: `backend/app/models/telemetry.py`, `backend/app/models/case.py`, `backend/seed/schema.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/tests/test_models_schema.py`

**Interfaces:**
- Consumes: `Base` and all Task 2 models.
- Produces (column names match spec §3.3–3.4 exactly):
  - `CellPing(ping_id: bigint pk, phone_number: str, tower_id: str, ping_time: datetime, signal_strength_dbm: int, case_id: uuid|None)`
  - `CallRecord(cdr_id: bigint pk, caller_num: str, receiver_num: str, start_time: datetime, duration_sec: int, is_sms: bool, tower_id: str|None, case_id: uuid|None)`
  - `CctvSighting(sighting_id: bigint pk, camera_id: str, seen_time: datetime, citizen_id: uuid|None, detected_height_cm: int, clothing_tags: list[str], face_confidence: Decimal, case_id: uuid|None)`
  - `FinancialTransaction(tx_id: bigint pk, account_id: str, merchant_name: str, merchant_category: str, amount: Decimal, tx_time: datetime, atm_id: str|None, is_cash_withdrawal: bool, terminal_lat: float|None, terminal_lon: float|None, case_id: uuid|None)`
  - `AnprEvent(anpr_id: bigint pk, border_camera_id: str, plate_number: str, seen_time: datetime, direction: str, observed_make: str, observed_model: str, case_id: uuid|None)`
  - `SocialPost(post_id: bigint pk, handle: str, content: str, posted_time: datetime, reply_to: str|None, case_id: uuid|None)`
  - `BreachDump(breach_id: bigint pk, breach_source: str, leaked_username: str, leaked_email: str, leaked_ip: str|None, password_hash: str, case_id: uuid|None)`
  - `Case(case_id: uuid pk, title: str, tier: int|None, mode: str, status: str, victim_citizen_id: uuid, crime_time: datetime, scene_address: str, scene_lat: float, scene_lon: float, briefing_text: str, solution_json: dict, created_at: datetime)`
  - `CaseEvidence(evidence_id: uuid pk, case_id: uuid, evidence_type: str, payload_json: dict, is_discovered: bool)`
  - `WitnessReport(report_id: uuid pk, case_id: uuid, witness_name: str, statement_text: str, observed_time: datetime, reliability_penalty: Decimal)`
  - `InvestigationLog(log_id: bigint pk, case_id: uuid, step_no: int, role: str, content: str|None, tool_name: str|None, tool_args: dict|None, tool_result: dict|None, created_at: datetime)`
  - `seed.schema.ensure_extensions(conn)` — runs `CREATE EXTENSION IF NOT EXISTS pg_trgm`; raises `RuntimeError` if it fails.
  - `seed.schema.create_all_tables()` / `drop_all_tables()` — `Base.metadata.create_all(engine)` / `drop_all(engine)`.

- [ ] **Step 1: Append the failing tests to `tests/test_models_schema.py`**

```python
def test_all_19_tables_registered():
    from app.models import Base
    names = set(Base.metadata.tables.keys())
    expected = {
        "households", "citizens", "criminal_records", "phones", "vehicles",
        "cctv_cameras", "bank_accounts", "social_profiles",
        "cell_pings", "call_records", "cctv_sightings", "financial_transactions",
        "anpr_events", "social_posts", "breach_dumps",
        "cases", "case_evidence", "witness_reports", "investigation_log",
    }
    assert expected == names


def test_telemetry_tables_have_case_id():
    from app.models import Base
    for t in ("cell_pings", "call_records", "cctv_sightings",
              "financial_transactions", "anpr_events", "social_posts", "breach_dumps"):
        assert "case_id" in Base.metadata.tables[t].columns


@pytest.mark.slow
def test_create_all_and_drop_all_roundtrip(engine):
    from seed.schema import create_all_tables, drop_all_tables, ensure_extensions
    from app.db import raw_connection
    from sqlalchemy import inspect
    with raw_connection() as conn:
        ensure_extensions(conn)
        conn.commit()
    drop_all_tables()
    create_all_tables()
    tables = set(inspect(engine).get_table_names())
    assert {"citizens", "cell_pings", "cases"}.issubset(tables)
    drop_all_tables()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_models_schema.py -v`
Expected: FAIL — `test_all_19_tables_registered` (only 8 tables) and `ModuleNotFoundError: seed.schema`

- [ ] **Step 3: Write `app/models/telemetry.py`**

```python
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Integer, BigInteger, Boolean, Float, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY, INET
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CellPing(Base):
    __tablename__ = "cell_pings"
    ping_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    phone_number: Mapped[str] = mapped_column(String(32), index=True)
    tower_id: Mapped[str] = mapped_column(String(16), index=True)
    ping_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    signal_strength_dbm: Mapped[int] = mapped_column(Integer)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True, index=True)


class CallRecord(Base):
    __tablename__ = "call_records"
    cdr_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    caller_num: Mapped[str] = mapped_column(String(32), index=True)
    receiver_num: Mapped[str] = mapped_column(String(32), index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duration_sec: Mapped[int] = mapped_column(Integer, default=0)
    is_sms: Mapped[bool] = mapped_column(Boolean, default=False)
    tower_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class CctvSighting(Base):
    __tablename__ = "cctv_sightings"
    sighting_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    camera_id: Mapped[str] = mapped_column(ForeignKey("cctv_cameras.camera_id"), index=True)
    seen_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    citizen_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("citizens.citizen_id"), nullable=True)
    detected_height_cm: Mapped[int] = mapped_column(Integer)
    clothing_tags: Mapped[list[str]] = mapped_column(ARRAY(String(32)), default=list)
    face_confidence: Mapped[Decimal] = mapped_column(Numeric(3, 2))
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"
    tx_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    account_id: Mapped[str] = mapped_column(String(24), index=True)
    merchant_name: Mapped[str] = mapped_column(String(96))
    merchant_category: Mapped[str] = mapped_column(String(32))
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    tx_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    atm_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    is_cash_withdrawal: Mapped[bool] = mapped_column(Boolean, default=False)
    terminal_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    terminal_lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class AnprEvent(Base):
    __tablename__ = "anpr_events"
    anpr_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    border_camera_id: Mapped[str] = mapped_column(String(16))
    plate_number: Mapped[str] = mapped_column(String(16), index=True)
    seen_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    direction: Mapped[str] = mapped_column(String(12))
    observed_make: Mapped[str] = mapped_column(String(32))
    observed_model: Mapped[str] = mapped_column(String(32))
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class SocialPost(Base):
    __tablename__ = "social_posts"
    post_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    handle: Mapped[str] = mapped_column(String(48), index=True)
    content: Mapped[str] = mapped_column(Text)
    posted_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reply_to: Mapped[str | None] = mapped_column(String(48), nullable=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class BreachDump(Base):
    __tablename__ = "breach_dumps"
    breach_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    breach_source: Mapped[str] = mapped_column(String(64))
    leaked_username: Mapped[str] = mapped_column(String(64), index=True)
    leaked_email: Mapped[str] = mapped_column(String(128), index=True)
    leaked_ip: Mapped[str | None] = mapped_column(INET, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(64))
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)
```

- [ ] **Step 4: Write `app/models/case.py`**

```python
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Integer, BigInteger, Boolean, Float, Numeric, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Case(Base):
    __tablename__ = "cases"
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(128))
    tier: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mode: Mapped[str] = mapped_column(String(12))          # FROZEN | WILDCARD
    status: Mapped[str] = mapped_column(String(16), default="ACTIVE")
    victim_citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("citizens.citizen_id"))
    crime_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    scene_address: Mapped[str] = mapped_column(String(256))
    scene_lat: Mapped[float] = mapped_column(Float)
    scene_lon: Mapped[float] = mapped_column(Float)
    briefing_text: Mapped[str] = mapped_column(Text)
    solution_json: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CaseEvidence(Base):
    __tablename__ = "case_evidence"
    evidence_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.case_id"), index=True)
    evidence_type: Mapped[str] = mapped_column(String(32))
    payload_json: Mapped[dict] = mapped_column(JSONB)
    is_discovered: Mapped[bool] = mapped_column(Boolean, default=False)


class WitnessReport(Base):
    __tablename__ = "witness_reports"
    report_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.case_id"), index=True)
    witness_name: Mapped[str] = mapped_column(String(96))
    statement_text: Mapped[str] = mapped_column(Text)
    observed_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reliability_penalty: Mapped[Decimal] = mapped_column(Numeric(3, 2))


class InvestigationLog(Base):
    __tablename__ = "investigation_log"
    log_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.case_id"), index=True)
    step_no: Mapped[int] = mapped_column(Integer)
    role: Mapped[str] = mapped_column(String(16))          # INVESTIGATOR | AGENT | TOOL
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    tool_name: Mapped[str | None] = mapped_column(String(48), nullable=True)
    tool_args: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tool_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 5: Update `app/models/__init__.py`**

```python
from app.models.base import Base
from app.models.world import (
    Household, Citizen, CriminalRecord, Phone, Vehicle,
    CctvCamera, BankAccount, SocialProfile,
)
from app.models.telemetry import (
    CellPing, CallRecord, CctvSighting, FinancialTransaction,
    AnprEvent, SocialPost, BreachDump,
)
from app.models.case import Case, CaseEvidence, WitnessReport, InvestigationLog

__all__ = [
    "Base",
    "Household", "Citizen", "CriminalRecord", "Phone", "Vehicle",
    "CctvCamera", "BankAccount", "SocialProfile",
    "CellPing", "CallRecord", "CctvSighting", "FinancialTransaction",
    "AnprEvent", "SocialPost", "BreachDump",
    "Case", "CaseEvidence", "WitnessReport", "InvestigationLog",
]
```

- [ ] **Step 6: Write `seed/schema.py`**

```python
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
```

- [ ] **Step 7: Run tests**

Run (schema-only, no DB): `cd backend && python -m pytest tests/test_models_schema.py -v -m "not slow"`
Expected: PASS (5 passed)

Run (with a real `DATABASE_URL` in `.env`): `cd backend && python -m pytest tests/test_models_schema.py -v`
Expected: PASS (6 passed) — the `slow` round-trip creates and drops all 19 tables.

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/ backend/seed/schema.py backend/tests/test_models_schema.py
git commit -m "feat(backend): telemetry + case models, pg_trgm bootstrap, full create_all round-trip"
```

---

## Task 4: Deterministic geometry & population builders (pure)

**Files:**
- Create: `backend/seed/geometry.py`, `backend/seed/population.py`
- Test: `backend/tests/test_geometry.py`, `backend/tests/test_population.py`

**Interfaces:**
- Consumes: `seed.constants`.
- Produces:
  - `geometry.place_towers() -> list[dict]` — 6 dicts `{tower_id, lat, lon}` on a fixed 2×3 lattice.
  - `geometry.place_cameras(rng) -> list[dict]` — 30 dicts `{camera_id, lat, lon, coverage_desc}`, ~70% clustered in `x,y ∈ [600, 1400]`.
  - `geometry.nearest_tower(lat, lon, towers) -> str`.
  - `geometry.has_camera_coverage(lat, lon, cameras, radius_m=120.0) -> bool`.
  - `population.build_households(rng, faker) -> list[dict]` — keys `household_id` (str uuid), `address`, `lat`, `lon`, `household_type`, `wan_ip`, `nearest_tower_id`; may carry a transient `_residents_override: int`.
  - `population.build_citizens(rng, faker, households) -> list[dict]` — exactly `POP` dicts with every `citizens` column key.
  - `population.pick_criminals(rng, citizens) -> list[dict]` — 45 `criminal_records` dicts.

- [ ] **Step 1: Write the failing test — `tests/test_geometry.py`**

```python
import numpy as np
from seed import geometry


def test_place_towers_returns_six_on_grid():
    towers = geometry.place_towers()
    assert len(towers) == 6
    assert all(0 <= t["lat"] <= 2000 and 0 <= t["lon"] <= 2000 for t in towers)
    assert {t["tower_id"] for t in towers} == {f"TOWER-{i}" for i in range(1, 7)}


def test_place_cameras_is_deterministic():
    a = geometry.place_cameras(np.random.default_rng(42))
    b = geometry.place_cameras(np.random.default_rng(42))
    assert a == b
    assert len(a) == 30


def test_nearest_tower_picks_closest():
    towers = geometry.place_towers()
    t = geometry.nearest_tower(towers[0]["lat"], towers[0]["lon"], towers)
    assert t == towers[0]["tower_id"]


def test_camera_coverage_true_near_a_camera_false_far():
    cams = geometry.place_cameras(np.random.default_rng(1))
    c = cams[0]
    assert geometry.has_camera_coverage(c["lat"], c["lon"], cams) is True
    assert geometry.has_camera_coverage(-500, -500, cams) is False
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && python -m pytest tests/test_geometry.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'seed.geometry'`

- [ ] **Step 3: Write `seed/geometry.py`**

```python
import math

from seed.constants import GRID_METERS, TOWER_IDS, CAMERA_IDS

_COVERAGE_DESCS = [
    "High St junction", "Market square", "Rail station forecourt", "Bus interchange",
    "Riverside path", "Retail park entrance", "Town hall steps", "Car park level 2",
    "Pedestrian bridge", "Cinema frontage",
]


def place_towers() -> list[dict]:
    xs = [GRID_METERS * 0.25, GRID_METERS * 0.75]
    ys = [GRID_METERS * 0.17, GRID_METERS * 0.5, GRID_METERS * 0.83]
    towers, i = [], 0
    for y in ys:
        for x in xs:
            towers.append({"tower_id": TOWER_IDS[i], "lat": round(y, 2), "lon": round(x, 2)})
            i += 1
    return towers


def place_cameras(rng) -> list[dict]:
    cams = []
    for idx, cam_id in enumerate(CAMERA_IDS):
        if idx < 21:
            lat = float(rng.uniform(600, 1400))
            lon = float(rng.uniform(600, 1400))
        else:
            lat = float(rng.uniform(0, GRID_METERS))
            lon = float(rng.uniform(0, GRID_METERS))
        cams.append({
            "camera_id": cam_id, "lat": round(lat, 2), "lon": round(lon, 2),
            "coverage_desc": _COVERAGE_DESCS[idx % len(_COVERAGE_DESCS)],
        })
    return cams


def nearest_tower(lat: float, lon: float, towers: list[dict]) -> str:
    return min(towers, key=lambda t: (t["lat"] - lat) ** 2 + (t["lon"] - lon) ** 2)["tower_id"]


def has_camera_coverage(lat: float, lon: float, cameras: list[dict], radius_m: float = 120.0) -> bool:
    return any(math.hypot(c["lat"] - lat, c["lon"] - lon) <= radius_m for c in cameras)
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd backend && python -m pytest tests/test_geometry.py -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Write the failing test — `tests/test_population.py`**

```python
import numpy as np
from faker import Faker
from seed import population
from seed.constants import POP


def _rng_faker():
    fk = Faker("en_GB")
    Faker.seed(42)
    return np.random.default_rng(42), fk


def test_households_cover_exactly_pop_residents():
    rng, fk = _rng_faker()
    hh = population.build_households(rng, fk)
    size = {"SOLITARY": 1, "COUPLE": 2, "NUCLEAR": 4, "HMO": 7}
    total = sum(h.get("_residents_override", size[h["household_type"]]) for h in hh)
    assert total == POP


def test_build_citizens_count_and_ghost_rate():
    rng, fk = _rng_faker()
    hh = population.build_households(rng, fk)
    cz = population.build_citizens(rng, fk, hh)
    assert len(cz) == POP
    ghosts = [c for c in cz if c["national_id"] is None]
    assert 55 <= len(ghosts) <= 105          # target 80 (8%)


def test_build_citizens_is_deterministic():
    rng1, fk1 = _rng_faker()
    cz1 = population.build_citizens(rng1, fk1, population.build_households(rng1, fk1))
    rng2, fk2 = _rng_faker()
    cz2 = population.build_citizens(rng2, fk2, population.build_households(rng2, fk2))
    assert [c["full_name"] for c in cz1] == [c["full_name"] for c in cz2]
    assert [c["address"] for c in cz1] == [c["address"] for c in cz2]


def test_pick_criminals_returns_45_with_hashes():
    rng, fk = _rng_faker()
    cz = population.build_citizens(rng, fk, population.build_households(rng, fk))
    crims = population.pick_criminals(rng, cz)
    assert len(crims) == 45
    assert all(len(c["fingerprint_hash"]) == 64 for c in crims)
    assert all(set(c["dna_string"]) <= set("ACGT") for c in crims)
```

- [ ] **Step 6: Run to verify it fails**

Run: `cd backend && python -m pytest tests/test_population.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'seed.population'`

- [ ] **Step 7: Write `seed/population.py`**

```python
import hashlib
import ipaddress
import uuid
from datetime import date

import numpy as np

from seed.constants import (
    POP, DEMOGRAPHIC_RATIOS, EMPLOYMENT_RATIOS, GHOST_RATE, STALE_ADDRESS_RATE,
)
from seed import geometry

_HH_SIZE = {"SOLITARY": 1, "COUPLE": 2, "NUCLEAR": 4, "HMO": 7}
_WORKPLACES = [
    "Ashwick General Hospital", "Northgate Factory", "Riverside Logistics",
    "Town Hall", "Greenfield School", "Ashwick Retail Park", "Pelham Call Centre",
]
_OCCUPATIONS = [
    "nurse", "line operative", "warehouse picker", "clerk", "teacher",
    "shop assistant", "call handler", "driver", "cleaner", "security guard",
]
_PRIORS = [
    "Two counts ABH, 2018.", "Burglary (dwelling), 2016; breach of bail 2017.",
    "Affray 2019; possession offensive weapon 2020.", "Fraud by false representation, 2015.",
]


def _counts_from_ratios(ratios: dict, total: int) -> dict:
    raw = {k: int(round(v * total)) for k, v in ratios.items()}
    first = next(iter(raw))
    raw[first] += total - sum(raw.values())
    return raw


def _det_uuid(rng) -> str:
    return str(uuid.UUID(bytes=bytes(rng.integers(0, 256, size=16, dtype="uint8").tolist())))


def _plate(rng) -> str:
    letters = "ABCDEFGHJKLMNOPRSTUVWXYZ"
    a = "".join(letters[i] for i in rng.integers(0, len(letters), size=2))
    nums = "".join(str(d) for d in rng.integers(0, 10, size=2))
    b = "".join(letters[i] for i in rng.integers(0, len(letters), size=3))
    return f"{a}{nums} {b}"


def build_households(rng, faker) -> list[dict]:
    towers = geometry.place_towers()
    residents = _counts_from_ratios(DEMOGRAPHIC_RATIOS, POP)
    households: list[dict] = []
    for htype, res_count in residents.items():
        size = _HH_SIZE[htype]
        n_full, remainder = divmod(res_count, size)
        for _ in range(n_full):
            households.append(_one_household(rng, faker, htype, towers))
        if remainder:
            h = _one_household(rng, faker, htype, towers)
            h["_residents_override"] = remainder
            households.append(h)
    return households


def _one_household(rng, faker, htype, towers) -> dict:
    lat = float(rng.uniform(0, 2000))
    lon = float(rng.uniform(0, 2000))
    ip_int = int(rng.integers(0x0A000000, 0x0AFFFFFF))
    return {
        "household_id": _det_uuid(rng),
        "address": faker.street_address(),
        "lat": round(lat, 2),
        "lon": round(lon, 2),
        "household_type": htype,
        "wan_ip": str(ipaddress.IPv4Address(ip_int)),
        "nearest_tower_id": geometry.nearest_tower(lat, lon, towers),
    }


def build_citizens(rng, faker, households: list[dict]) -> list[dict]:
    emp = _counts_from_ratios(EMPLOYMENT_RATIOS, POP)
    emp_pool: list[str] = []
    for k, v in emp.items():
        emp_pool.extend([k] * v)
    rng.shuffle(emp_pool)

    citizens: list[dict] = []
    seq = 0
    for h in households:
        n = h.get("_residents_override", _HH_SIZE[h["household_type"]])
        for _ in range(n):
            emp_kind = emp_pool[seq] if seq < len(emp_pool) else "DAY"
            seq += 1
            citizens.append(_one_citizen(rng, faker, h, emp_kind))
    return citizens[:POP]


def _one_citizen(rng, faker, household, emp_kind) -> dict:
    cid = _det_uuid(rng)
    is_ghost = rng.random() < GHOST_RATE
    gender = faker.random_element(["male", "female"])
    name = faker.name_male() if gender == "male" else faker.name_female()
    dob = date(int(rng.integers(1945, 2006)), int(rng.integers(1, 13)), int(rng.integers(1, 28)))

    shift, is_unemployed, workplace = "NONE", False, None
    if emp_kind in ("DAY", "SWING", "GRAVEYARD"):
        shift = emp_kind
        workplace = faker.random_element(_WORKPLACES)
    elif emp_kind == "UNEMPLOYED":
        is_unemployed = True

    if rng.random() < STALE_ADDRESS_RATE:
        address = faker.street_address()
        updated_year = int(rng.integers(2009, 2019))
    else:
        address = household["address"]
        updated_year = int(rng.integers(2019, 2026))

    phone = None
    if rng.random() < 0.92:
        phone = "+4470" + "".join(str(d) for d in rng.integers(0, 10, size=8))

    plate = _plate(rng) if rng.random() < 0.40 else None

    return {
        "citizen_id": cid,
        "national_id": None if is_ghost else "GB" + "".join(str(d) for d in rng.integers(0, 10, size=9)),
        "full_name": name,
        "aliases": [],
        "dob": dob,
        "gender": gender,
        "address": address,
        "address_updated_year": updated_year,
        "legal_status": "ACTIVE",
        "household_id": household["household_id"],
        "occupation": faker.random_element(_OCCUPATIONS),
        "workplace_name": workplace,
        "shift_pattern": shift,
        "is_unemployed": is_unemployed,
        "phone_number": phone,
        "registered_plate": plate,
        "photo_url": f"https://i.pravatar.cc/128?u={cid}",
    }


def pick_criminals(rng, citizens: list[dict]) -> list[dict]:
    idx = rng.choice(len(citizens), size=45, replace=False)
    out = []
    for i in idx:
        c = citizens[int(i)]
        local_seed = int(hashlib.sha256(c["citizen_id"].encode()).hexdigest(), 16) % (2 ** 32)
        local = np.random.default_rng(local_seed)
        dna = "".join("ACGT"[b] for b in local.integers(0, 4, size=100))
        out.append({
            "criminal_id": _det_uuid(rng),
            "citizen_id": c["citizen_id"],
            "priors_summary": _PRIORS[int(rng.integers(0, len(_PRIORS)))],
            "fingerprint_hash": hashlib.sha256(f"{c['citizen_id']}:print".encode()).hexdigest()[:64],
            "dna_string": dna,
        })
    return out
```

- [ ] **Step 8: Run to verify it passes**

Run: `cd backend && python -m pytest tests/test_population.py -v`
Expected: PASS (4 passed). If `test_build_citizens_is_deterministic` fails, an unseeded random path exists — every draw must use the passed `rng` or the seeded `faker`.

- [ ] **Step 9: Commit**

```bash
git add backend/seed/geometry.py backend/seed/population.py backend/tests/test_geometry.py backend/tests/test_population.py
git commit -m "feat(seed): deterministic geometry + population builders with unit tests"
```

---

## Task 5: Deterministic telemetry (routine) builders (pure)

**Files:**
- Create: `backend/seed/routines.py`
- Test: `backend/tests/test_routines.py`

**Interfaces:**
- Consumes: `seed.constants`, `seed.geometry`, and citizen/household dicts from Task 4.
- Produces (all pure; return lists of dicts keyed exactly by the matching model's columns, **without** autoincrement PKs and with `case_id` omitted so it defaults NULL):
  - `routines.build_phones(citizens_with_phone) -> list[dict]` — keys `phone_number, imei, citizen_id, subscriber_name, is_prepaid`.
  - `routines.build_bank_accounts(rng, citizens) -> list[dict]` — keys `account_id, citizen_id`; ~80% of citizens.
  - `routines.build_vehicles(rng, citizens) -> list[dict]` — keys `plate_number, make, model, color, registered_citizen_id`; one per citizen with a plate.
  - `routines.build_social(rng, faker, citizens) -> tuple[list[dict], list[dict]]` — `(profiles, posts)`; profile keys `username, platform, display_name, bio, recovery_email, citizen_id, is_private`; post keys `handle, content, posted_time, reply_to`.
  - `routines.build_breach_dumps(rng, profiles) -> list[dict]` — 600 rows, keys `breach_source, leaked_username, leaked_email, leaked_ip, password_hash`; ~40% reuse a real profile email.
  - `routines.build_cell_pings(rng, citizens, households, towers) -> list[dict]` — keys `phone_number, tower_id, ping_time, signal_strength_dbm`.
  - `routines.build_call_records(rng, citizens) -> list[dict]` — keys `caller_num, receiver_num, start_time, duration_sec, is_sms, tower_id`.
  - `routines.build_cctv_sightings(rng, citizens, cameras) -> list[dict]` — keys `camera_id, seen_time, citizen_id, detected_height_cm, clothing_tags, face_confidence`.
  - `routines.build_financial_transactions(rng, accounts) -> list[dict]` — keys `account_id, merchant_name, merchant_category, amount, tx_time, atm_id, is_cash_withdrawal, terminal_lat, terminal_lon`.
  - `routines.build_anpr_events(rng, vehicles) -> list[dict]` — keys `border_camera_id, plate_number, seen_time, direction, observed_make, observed_model`.

- [ ] **Step 1: Write the failing test — `tests/test_routines.py`**

```python
import numpy as np
from faker import Faker
from seed import routines, population, geometry


def _world():
    fk = Faker("en_GB"); Faker.seed(42)
    rng = np.random.default_rng(42)
    hh = population.build_households(rng, fk)
    cz = population.build_citizens(rng, fk, hh)
    return rng, fk, hh, cz


def test_phones_one_per_citizen_with_number():
    rng, fk, hh, cz = _world()
    with_phone = [c for c in cz if c["phone_number"]]
    phones = routines.build_phones(with_phone)
    assert len(phones) == len(with_phone)
    assert all(p["subscriber_name"] and p["is_prepaid"] is False for p in phones)


def test_cell_pings_are_deterministic_and_bounded():
    rng1, fk1, hh1, cz1 = _world()
    towers = geometry.place_towers()
    p1 = routines.build_cell_pings(rng1, cz1, hh1, towers)
    rng2, fk2, hh2, cz2 = _world()
    p2 = routines.build_cell_pings(rng2, cz2, hh2, towers)
    assert len(p1) == len(p2)
    assert p1[:50] == p2[:50]
    assert all(-115 <= r["signal_strength_dbm"] <= -55 for r in p1[:500])
    assert all(r["tower_id"].startswith("TOWER-") for r in p1[:500])


def test_pings_volume_in_expected_range():
    rng, fk, hh, cz = _world()
    towers = geometry.place_towers()
    pings = routines.build_cell_pings(rng, cz, hh, towers)
    assert 120_000 <= len(pings) <= 260_000


def test_sightings_night_confidence_lower_than_day():
    rng, fk, hh, cz = _world()
    cams = geometry.place_cameras(rng)
    s = routines.build_cctv_sightings(rng, cz, cams)
    night = [r for r in s if r["seen_time"].hour >= 22 or r["seen_time"].hour < 6]
    day = [r for r in s if 8 <= r["seen_time"].hour <= 18]
    assert night and day
    assert (sum(float(r["face_confidence"]) for r in night) / len(night)) < \
           (sum(float(r["face_confidence"]) for r in day) / len(day))


def test_financials_have_some_cash_withdrawals():
    rng, fk, hh, cz = _world()
    accts = routines.build_bank_accounts(rng, cz)
    txs = routines.build_financial_transactions(rng, accts)
    cash = [t for t in txs if t["is_cash_withdrawal"]]
    assert cash and all(t["atm_id"] for t in cash)
    assert all(t["amount"] > 0 for t in txs)
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && python -m pytest tests/test_routines.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'seed.routines'`

- [ ] **Step 3: Write `seed/routines.py`**

```python
import hashlib
from datetime import timedelta
from decimal import Decimal

import numpy as np

from seed.constants import SIM_START, SIM_DAYS, PING_INTERVAL_MIN, ANPR_IDS

_CLOTHING = ["dark jacket", "hoodie", "jeans", "trainers", "backpack", "cap",
             "long coat", "hi-vis", "tracksuit", "boots"]
_MERCH = {
    "GROCERY": ["Ashwick Co-op", "Nisa Local", "Tesco Express"],
    "FUEL": ["BP Northgate", "Shell Riverside"],
    "RETAIL": ["Argos", "Boots", "Sports Direct"],
    "PHARMACY": ["Boots Pharmacy", "Well Pharmacy"],
    "HOSPITALITY": ["The Anchor", "Costa", "Greggs"],
    "HARDWARE": ["Wickes", "Screwfix"],
}
_MERCH_WEIGHTS = [("GROCERY", 0.40), ("HOSPITALITY", 0.22), ("FUEL", 0.15),
                  ("RETAIL", 0.15), ("PHARMACY", 0.05), ("HARDWARE", 0.03)]
_MAKES = [("Ford", "Fiesta"), ("Vauxhall", "Astra"), ("VW", "Golf"),
          ("Toyota", "Yaris"), ("BMW", "3 Series"), ("Kia", "Sportage")]
_COLORS = ["black", "silver", "white", "blue", "grey", "red"]
_SHIFT_AWAKE = {"DAY": (6, 23), "SWING": (10, 26), "GRAVEYARD": (19, 32), "NONE": (7, 23)}


def _det_digits(seed_str: str, n: int) -> str:
    h = hashlib.sha256(seed_str.encode()).hexdigest()
    return "".join(str(int(h[i], 16) % 10) for i in range(n))


def build_phones(citizens_with_phone: list[dict]) -> list[dict]:
    return [{
        "phone_number": c["phone_number"],
        "imei": "35" + _det_digits(c["phone_number"], 13),
        "citizen_id": c["citizen_id"],
        "subscriber_name": c["full_name"],
        "is_prepaid": False,
    } for c in citizens_with_phone]


def build_bank_accounts(rng, citizens: list[dict]) -> list[dict]:
    out = []
    for c in citizens:
        if rng.random() < 0.80:
            out.append({
                "account_id": "AC" + "".join(str(d) for d in rng.integers(0, 10, size=10)),
                "citizen_id": c["citizen_id"],
            })
    return out


def build_vehicles(rng, citizens: list[dict]) -> list[dict]:
    out = []
    for c in citizens:
        if c["registered_plate"]:
            mk, md = _MAKES[int(rng.integers(0, len(_MAKES)))]
            out.append({
                "plate_number": c["registered_plate"], "make": mk, "model": md,
                "color": _COLORS[int(rng.integers(0, len(_COLORS)))],
                "registered_citizen_id": c["citizen_id"],
            })
    return out


def _email_for(name: str) -> str:
    slug = name.lower().replace(" ", ".").replace("'", "")
    return f"{slug}@ashmail.co.uk"


def build_social(rng, faker, citizens: list[dict]) -> tuple[list[dict], list[dict]]:
    profiles, posts = [], []
    for c in citizens:
        if rng.random() >= 0.30:
            continue
        n_profiles = 1 + int(rng.random() < 0.4)
        for k in range(n_profiles):
            platform = "ASHGRAM" if k == 0 else "CHIRPER"
            handle = c["full_name"].split()[0].lower() + str(int(rng.integers(10, 9999)))
            profiles.append({
                "username": handle, "platform": platform,
                "display_name": c["full_name"], "bio": faker.sentence(nb_words=6),
                "recovery_email": _email_for(c["full_name"]),
                "citizen_id": c["citizen_id"], "is_private": bool(rng.random() < 0.3),
            })
            for day in range(SIM_DAYS):
                if rng.random() < 0.8:
                    t = SIM_START + timedelta(days=day, hours=int(rng.integers(7, 23)),
                                              minutes=int(rng.integers(0, 60)))
                    posts.append({"handle": handle, "content": faker.sentence(nb_words=12),
                                  "posted_time": t, "reply_to": None})
    return profiles, posts


def build_breach_dumps(rng, profiles: list[dict]) -> list[dict]:
    real_emails = [p["recovery_email"] for p in profiles]
    out = []
    for _ in range(600):
        if real_emails and rng.random() < 0.40:
            email = real_emails[int(rng.integers(0, len(real_emails)))]
            username = email.split("@")[0].replace(".", "_")
        else:
            n = int(rng.integers(0, 99999))
            email, username = f"user{n}@webmail.example", f"user{n}"
        out.append({
            "breach_source": "AshwickGym-2023",
            "leaked_username": username, "leaked_email": email,
            "leaked_ip": f"92.40.{int(rng.integers(0, 256))}.{int(rng.integers(1, 255))}",
            "password_hash": "".join("0123456789abcdef"[int(rng.integers(0, 16))] for _ in range(40)),
        })
    return out


def build_cell_pings(rng, citizens, households, towers) -> list[dict]:
    hh_by_id = {h["household_id"]: h for h in households}
    tower_ids = [t["tower_id"] for t in towers]
    out = []
    for c in citizens:
        if not c["phone_number"]:
            continue
        home = hh_by_id.get(c["household_id"])
        base_tower = home["nearest_tower_id"] if home else tower_ids[0]
        start_h, end_h = _SHIFT_AWAKE.get(c["shift_pattern"], _SHIFT_AWAKE["NONE"])
        for day in range(SIM_DAYS):
            off = rng.random() < 0.10
            off_start = int(rng.integers(start_h, end_h)) if off else None
            minute = start_h * 60
            while minute < end_h * 60:
                cur_hour = minute // 60
                blocked = off and off_start is not None and off_start <= cur_hour <= off_start + 3
                if not blocked:
                    tower = base_tower if rng.random() < 0.85 else tower_ids[int(rng.integers(0, len(tower_ids)))]
                    out.append({
                        "phone_number": c["phone_number"], "tower_id": tower,
                        "ping_time": SIM_START + timedelta(days=day, minutes=minute),
                        "signal_strength_dbm": int(rng.integers(-110, -60)),
                    })
                minute += PING_INTERVAL_MIN
    return out


def build_call_records(rng, citizens) -> list[dict]:
    phones = [c["phone_number"] for c in citizens if c["phone_number"]]
    out = []
    for c in citizens:
        if not c["phone_number"]:
            continue
        contacts = [phones[int(rng.integers(0, len(phones)))] for _ in range(5)]
        for day in range(SIM_DAYS):
            for _ in range(int(rng.poisson(3))):
                t = SIM_START + timedelta(days=day, hours=int(rng.integers(7, 23)),
                                          minutes=int(rng.integers(0, 60)))
                out.append({"caller_num": c["phone_number"],
                            "receiver_num": contacts[int(rng.integers(0, len(contacts)))],
                            "start_time": t, "duration_sec": int(rng.integers(20, 900)),
                            "is_sms": False, "tower_id": None})
            for _ in range(int(rng.poisson(4))):
                t = SIM_START + timedelta(days=day, hours=int(rng.integers(7, 23)),
                                          minutes=int(rng.integers(0, 60)))
                out.append({"caller_num": c["phone_number"],
                            "receiver_num": contacts[int(rng.integers(0, len(contacts)))],
                            "start_time": t, "duration_sec": 0, "is_sms": True, "tower_id": None})
    return out


def build_cctv_sightings(rng, citizens, cameras) -> list[dict]:
    ids = [c["citizen_id"] for c in citizens]
    out = []
    for cam in cameras:
        for day in range(SIM_DAYS):
            for _ in range(int(rng.integers(30, 61))):
                hour, minute = int(rng.integers(0, 24)), int(rng.integers(0, 60))
                is_night = hour >= 22 or hour < 6
                conf = round(float(rng.uniform(0.55, 0.95)) * (0.5 if is_night else 1.0), 2)
                resolves = rng.random() < 0.60
                ntags = int(rng.integers(1, 4))
                out.append({
                    "camera_id": cam["camera_id"],
                    "seen_time": SIM_START + timedelta(days=day, hours=hour, minutes=minute),
                    "citizen_id": ids[int(rng.integers(0, len(ids)))] if resolves else None,
                    "detected_height_cm": int(rng.integers(150, 196)),
                    "clothing_tags": [_CLOTHING[int(rng.integers(0, len(_CLOTHING)))] for _ in range(ntags)],
                    "face_confidence": Decimal(str(conf)),
                })
    return out


def build_financial_transactions(rng, accounts) -> list[dict]:
    cats = [c for c, _ in _MERCH_WEIGHTS]
    weights = np.array([w for _, w in _MERCH_WEIGHTS])
    weights = weights / weights.sum()
    out = []
    for a in accounts:
        for day in range(SIM_DAYS):
            for _ in range(int(rng.poisson(1.8))):
                base_t = SIM_START + timedelta(days=day, hours=int(rng.integers(7, 23)),
                                               minutes=int(rng.integers(0, 60)))
                if rng.random() < 0.05:
                    atm = f"ATM-{int(rng.integers(1, 13)):02d}"
                    amt = Decimal(str(int(rng.choice([20, 40, 60, 100, 150, 200, 300]))))
                    out.append({"account_id": a["account_id"], "merchant_name": f"ATM {atm}",
                                "merchant_category": "CASH", "amount": amt, "tx_time": base_t,
                                "atm_id": atm, "is_cash_withdrawal": True,
                                "terminal_lat": float(rng.uniform(0, 2000)),
                                "terminal_lon": float(rng.uniform(0, 2000))})
                else:
                    cat = str(rng.choice(cats, p=weights))
                    merch = _MERCH[cat][int(rng.integers(0, len(_MERCH[cat])))]
                    amt = Decimal(str(round(float(rng.uniform(3, 85)), 2)))
                    out.append({"account_id": a["account_id"], "merchant_name": merch,
                                "merchant_category": cat, "amount": amt, "tx_time": base_t,
                                "atm_id": None, "is_cash_withdrawal": False,
                                "terminal_lat": float(rng.uniform(0, 2000)),
                                "terminal_lon": float(rng.uniform(0, 2000))})
    return out


def build_anpr_events(rng, vehicles) -> list[dict]:
    out = []
    for v in vehicles:
        for day in range(SIM_DAYS):
            if rng.random() < 0.30:
                out.append({
                    "border_camera_id": ANPR_IDS[int(rng.integers(0, len(ANPR_IDS)))],
                    "plate_number": v["plate_number"],
                    "seen_time": SIM_START + timedelta(days=day, hours=int(rng.integers(5, 23)),
                                                       minutes=int(rng.integers(0, 60))),
                    "direction": "INBOUND" if rng.random() < 0.5 else "OUTBOUND",
                    "observed_make": v["make"], "observed_model": v["model"],
                })
    return out
```

> Executor notes:
> - `numpy.random.Generator` has `.poisson(...)` and `.choice(seq, p=weights)`; `.choice` on a Python list returns a 0-d array — the `str(...)` / `int(...)` wrappers shown are required.
> - Every random draw must come from the passed `rng` (or a generator seeded from a stable key, as in `pick_criminals`), or determinism tests fail.
> - `_SHIFT_AWAKE` end hours above 24 mean "past midnight"; `build_cell_pings` uses raw minute offsets from `SIM_START + day`, so a `GRAVEYARD` window `(19, 32)` correctly spans 19:00 to 08:00 next day. Do not `% 24` the loop bound.

- [ ] **Step 4: Run to verify it passes**

Run: `cd backend && python -m pytest tests/test_routines.py -v`
Expected: PASS (5 passed). If `test_pings_volume_in_expected_range` is out of band, tune the `_SHIFT_AWAKE` windows (not the test) until volume lands in 120k–260k.

- [ ] **Step 5: Commit**

```bash
git add backend/seed/routines.py backend/tests/test_routines.py
git commit -m "feat(seed): deterministic 7-day telemetry builders with unit tests"
```

---

## Task 6: Seeder orchestration + `python -m seed.seed_world` + integration test

**Files:**
- Create: `backend/seed/scenarios.py`, `backend/seed/seed_world.py`
- Test: `backend/tests/test_seed_integration.py`

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces:
  - `scenarios.load_frozen_scenarios() -> list[dict]` — reads `backend/scenarios/tier*.json`; returns `[]` and logs a `WARNING` if none (Plan 03 fills it).
  - `seed_world.bulk_copy(conn, table: str, rows: list[dict]) -> int` — loads rows with PostgreSQL `COPY` via `psycopg.sql` identifier composition (no value interpolation). Column list from the first row's keys.
  - `seed_world.run(drop: bool = True) -> dict` — `ensure_extensions` → (optional) `drop_all_tables` → `create_all_tables` → build world (pure) → `bulk_copy` each table → `load_frozen_scenarios` → return `{table_name: row_count}` (plus `frozen_scenarios`).
  - `python -m seed.seed_world` — calls `run()`, prints the summary + elapsed seconds, exits 0.

- [ ] **Step 1: Write the failing test — `tests/test_seed_integration.py`**

```python
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && python -m pytest tests/test_seed_integration.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'seed.seed_world'`

- [ ] **Step 3: Write `seed/scenarios.py`**

```python
import glob
import json
import logging
import os

log = logging.getLogger("aegis.seed")

_DIR = os.path.join(os.path.dirname(__file__), "..", "scenarios")


def load_frozen_scenarios() -> list[dict]:
    paths = sorted(glob.glob(os.path.join(_DIR, "tier*.json")))
    if not paths:
        log.warning("No frozen scenarios in %s (Plan 03 generates them).", os.path.abspath(_DIR))
        return []
    out = []
    for p in paths:
        with open(p, "r", encoding="utf-8") as fh:
            out.append(json.load(fh))
    return out
```

- [ ] **Step 4: Write `seed/seed_world.py`**

```python
import logging
import time

import numpy as np
from faker import Faker
from psycopg import sql

from app.db import raw_connection
from seed import geometry, population, routines, scenarios
from seed.constants import RNG_SEED
from seed.schema import ensure_extensions, create_all_tables, drop_all_tables

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("aegis.seed")


def bulk_copy(conn, table: str, rows: list[dict]) -> int:
    if not rows:
        return 0
    cols = list(rows[0].keys())
    stmt = sql.SQL("COPY {tbl} ({cols}) FROM STDIN").format(
        tbl=sql.Identifier(table),
        cols=sql.SQL(", ").join(sql.Identifier(c) for c in cols),
    )
    with conn.cursor() as cur, cur.copy(stmt) as cp:
        for r in rows:
            cp.write_row([r[c] for c in cols])
    return len(rows)


def run(drop: bool = True) -> dict:
    t0 = time.time()
    rng = np.random.default_rng(RNG_SEED)
    faker = Faker("en_GB")
    Faker.seed(RNG_SEED)

    with raw_connection() as conn:
        ensure_extensions(conn)
        conn.commit()
    if drop:
        drop_all_tables()
    create_all_tables()

    towers = geometry.place_towers()
    cameras = geometry.place_cameras(rng)
    households = population.build_households(rng, faker)
    citizens = population.build_citizens(rng, faker, households)
    criminals = population.pick_criminals(rng, citizens)

    phones = routines.build_phones([c for c in citizens if c["phone_number"]])
    accounts = routines.build_bank_accounts(rng, citizens)
    vehicles = routines.build_vehicles(rng, citizens)
    profiles, posts = routines.build_social(rng, faker, citizens)
    breaches = routines.build_breach_dumps(rng, profiles)
    pings = routines.build_cell_pings(rng, citizens, households, towers)
    calls = routines.build_call_records(rng, citizens)
    sightings = routines.build_cctv_sightings(rng, citizens, cameras)
    txs = routines.build_financial_transactions(rng, accounts)
    anpr = routines.build_anpr_events(rng, vehicles)

    plan = [
        ("households", households), ("citizens", citizens), ("criminal_records", criminals),
        ("cctv_cameras", cameras), ("phones", phones), ("bank_accounts", accounts),
        ("vehicles", vehicles), ("social_profiles", profiles), ("social_posts", posts),
        ("breach_dumps", breaches), ("cell_pings", pings), ("call_records", calls),
        ("cctv_sightings", sightings), ("financial_transactions", txs), ("anpr_events", anpr),
    ]
    summary: dict[str, int] = {}
    with raw_connection() as conn:
        for table, rows in plan:
            clean = [{k: v for k, v in r.items() if not k.startswith("_")} for r in rows]
            summary[table] = bulk_copy(conn, table, clean)
            log.info("copied %-24s %8d", table, summary[table])
        conn.commit()

    summary["frozen_scenarios"] = len(scenarios.load_frozen_scenarios())
    log.info("seed complete in %.1fs", time.time() - t0)
    return summary


if __name__ == "__main__":
    result = run(drop=True)
    print("\n=== AEGIS seed summary ===")
    for name, count in result.items():
        print(f"{name:<24} {count:>10}")
```

> Executor note: `psycopg` 3's `cursor.copy()` accepts a composed `sql.SQL` statement. `cp.write_row` sends a Python list; `psycopg` adapts `datetime`, `Decimal`, `uuid.UUID`/str, `None`, and Python lists → Postgres `text[]` automatically. If a `clothing_tags` list needs coercion, pass it through unchanged first and only intervene if COPY raises.

- [ ] **Step 5: Run the integration tests**

Ensure `.env` has a real Neon `DATABASE_URL`. Run: `cd backend && python -m pytest tests/test_seed_integration.py -v`
Expected: PASS (3 passed). Runtime 30–90 s (three full seeds).

- [ ] **Step 6: Run the seeder as a script (manual smoke)**

Run: `cd backend && python -m seed.seed_world`
Expected: prints the summary; `citizens 1000`, `criminal_records 45`, `cell_pings` in 120k–260k, `frozen_scenarios 0`, elapsed under ~30 s.

- [ ] **Step 7: Run the whole suite**

Run: `cd backend && python -m pytest -v -m "not slow"` (fast, no DB) then `cd backend && python -m pytest -v` (all).
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add backend/seed/scenarios.py backend/seed/seed_world.py backend/tests/test_seed_integration.py
git commit -m "feat(seed): world seeder orchestration, COPY bulk load, deterministic integration tests"
```

---

## Task 7: README + seeder runbook

**Files:**
- Create: `backend/README.md`
- Create/Modify: repo-root `README.md`

**Interfaces:**
- Consumes: the finished seeder. Produces: documentation only.

- [ ] **Step 1: Write `backend/README.md`**

```markdown
# AEGIS backend

## Setup
1. `python -m venv .venv` then activate it
   (PowerShell: `.venv\Scripts\Activate.ps1`; bash: `. .venv/Scripts/activate`).
2. `pip install -r requirements.txt`
3. `cp .env.example .env` and paste your Neon **pooled** `DATABASE_URL`.

## Seed the world
    python -m seed.seed_world

Deterministic (RNG seed 42). ~1,000 citizens + 7 days of telemetry, ~20-25 MB, <30 s.
Re-running drops and rebuilds every table identically.

## Tests
    python -m pytest -v -m "not slow"   # pure unit tests, no database
    python -m pytest -v                  # + slow integration tests (needs DATABASE_URL)

## State after Plan 01
19 tables, base world only. No cases yet — `scenarios/` stays empty until Plan 03.
```

- [ ] **Step 2: Write / update repo-root `README.md`**

```markdown
# Project AEGIS

AI-assisted digital forensics investigation sandbox. Design: `docs/design/aegis-design.md`.

- `backend/` — FastAPI + SQLAlchemy + the deterministic world seeder
- `frontend/` — React murder board (Plan 05, not started)
- `docs/design/` — consolidated design document
- `docs/plans/` — per-subsystem implementation plans

## Status
- [x] Plan 01 — database schema + world seeder
- [ ] Plan 02 — the 7 agent tools
- [ ] Plan 03 — case generator + frozen scenarios
- [ ] Plan 04 — agent engine + API
- [ ] Plan 05 — frontend
```

- [ ] **Step 3: Verify docs (manual)**

Open both files; confirm code fences balance and commands match real module paths (`python -m seed.seed_world`).

- [ ] **Step 4: Commit**

```bash
git add backend/README.md README.md
git commit -m "docs: backend setup + seeder runbook, repo status board"
```

---

## Self-Review

**1. Spec coverage (design doc §2, §3, §4, §15):**

| Spec item | Task |
|---|---|
| Repo layout `backend/app/...` (§2) | Tasks 1–3 (routers/tools/services are Plans 02–04) |
| `config.py` env vars (§2, §15) | Task 1 |
| 8 base-world tables, exact columns (§3.2) | Task 2 |
| 7 telemetry tables + nullable `case_id` (§3.3) | Task 3 |
| 4 case tables incl. `solution_json` JSONB (§3.4) | Task 3 |
| `pg_trgm`, hard-fail if absent (§3, §15) | Task 3 (`ensure_extensions`), Task 6 (`test_pg_trgm_similarity_query_works`) |
| Deterministic seed, `RNG_SEED=42` (§4) | Tasks 4–6, `test_seed_is_deterministic` |
| 1,000 citizens, demographic/employment ratios (§4.1) | Task 4 |
| Ghosts 8%, criminals 4.5%, stale addr 25% (§4.1) | Task 4 |
| 30 cameras + blind spots, 6 towers (§4.1) | Task 4 |
| 7-day telemetry ≈ 260–290k rows, ~25 MB (§4.2) | Task 5 + Task 6 count assertions |
| Baseline-stable per-citizen routines (§4.3) | Task 5 (fixed shift window + seeded jitter) |
| Seeder loads frozen scenarios at end (§4, §7.3) | Task 6 (tolerant of empty dir) |
| Bulk load in batches (§4) | Task 6 (`COPY`, streamed) |

Gaps: none for Plan 01's scope. `app/main.py` (FastAPI entrypoint + `/health`) is deferred to Plan 04 where routes first exist — noted in the file-structure table.

**2. Placeholder scan:** No "TBD" / "handle edge cases" / "similar to Task N". Executor notes flag concrete library sharp edges (psycopg3 COPY adaptation, numpy 0-d `choice`, past-midnight awake windows) with exact fixes — guidance, not placeholders. Every code step contains runnable code.

**3. Type consistency:**
- `build_households` → dicts with `household_id` (str uuid) + transient `_residents_override`; consumed by `build_citizens` (`h.get("_residents_override", ...)`) and `build_cell_pings` (`hh_by_id`). `seed_world.run` strips `_`-prefixed keys before COPY. Consistent.
- `place_towers()` keys `tower_id/lat/lon` used identically in `nearest_tower`, `build_cell_pings`. Consistent.
- `build_bank_accounts` → `account_id`; consumed by `build_financial_transactions` as `a["account_id"]`. Consistent.
- `build_social` → `(profiles, posts)`; `build_breach_dumps(rng, profiles)` reads `p["recovery_email"]`. Consistent (signature updated from an earlier draft that also passed `citizens`).
- `run()` summary keys match `test_seed_integration` assertions (`citizens`, `households`, `criminal_records`, `cell_pings`, `cctv_sightings`, `financial_transactions`, `breach_dumps`, `frozen_scenarios`).
- Model column names (Tasks 2–3) match builder dict keys (Tasks 4–5): `citizens.address_updated_year`, `cctv_sightings.face_confidence`, `financial_transactions.is_cash_withdrawal`, `call_records.caller_num/receiver_num`, `anpr_events.observed_make/observed_model`.
- `WitnessReport.reliability_penalty` is `Numeric(3,2)` (Task 3) — not referenced by any Plan 01 builder (witness rows are Plan 03). No mismatch.

Fixed inline during review: table count corrected to 19 (was mis-stated 18); `build_breach_dumps` signature reduced to `(rng, profiles)`; `_SHIFT_AWAKE` documented as allowing >24 end-hours for past-midnight shifts; all f-string SQL removed in favour of `psycopg.sql.Identifier` + `COPY`.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-09-08-aegis-01-database-and-seeder.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using superpowers:executing-plans, batch execution with checkpoints.

Which approach?
