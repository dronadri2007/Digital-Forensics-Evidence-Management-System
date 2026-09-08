# AEGIS Plan 02 — The 7 Agent Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the seven forensic query tools the AI detective calls via function-calling — `search_civil_registry`, `match_biometrics`, `query_telecom`, `search_cctv`, `scan_financials`, `lookup_vehicle_anpr`, `pivot_digital_identity` — each a case-aware SQL query over the seeded Ashwick world, plus the Gemini function-declaration registry and a dispatcher.

**Architecture:** One module per tool under `backend/app/tools/`, each exporting a single function `fn(session, <domain args>, *, case_id=None) -> JSON-serialisable`. A shared `_common.py` holds pure helpers (timestamp parsing, hex Hamming distance). `registry_schema.py` holds the 7 plain-dict function declarations (Gemini-compatible, `case_id` never exposed), a `TOOL_REGISTRY` name→callable map, and `dispatch_tool()`. Tools read only; every query is parameterised; the case-layering predicate `(case_id IS NULL OR case_id = :case_id)` selects base-world rows plus the active case's rows in one expression (and base-world-only when `case_id` is `None`).

**Tech Stack:** Python 3.11, SQLAlchemy 2.0 Core `text()` queries over `app.db.SessionLocal`, `rapidfuzz` for DNA similarity, PostgreSQL 16 on Neon with `pg_trgm`. `pytest` with the `slow` marker for DB-backed tests.

**Spec:** `docs/design/aegis-design.md` (section 5; section 3 for table shapes; section 6.4 for how the tools compose into the "squeeze")

## Global Constraints

- **Every tool signature is exactly:** `def <name>(session: sqlalchemy.orm.Session, <domain args…>, *, case_id: str | None = None) -> <list[dict] | dict | str>`. `case_id` is **keyword-only, defaults `None`, and MUST NOT appear in the Gemini function declaration** — the agent layer binds it, the model never sees it.
- **Case-layering predicate:** for any table that has a `case_id` column (`cell_pings`, `call_records`, `phones`, `cctv_sightings`, `financial_transactions`, `anpr_events`, `social_posts`, `breach_dumps`), filter with `(case_id IS NULL OR case_id = :case_id)`. With `case_id=None` the bound value is SQL `NULL`, so `case_id = NULL` is never true and only base rows return — correct. Tables without a `case_id` column (`citizens`, `criminal_records`, `vehicles`, `cctv_cameras`, `bank_accounts`, `social_profiles`, `households`) take no such predicate.
- **In Plan 02 the `cases` / `case_evidence` / `witness_reports` tables are empty** (Plan 03 populates them). So every integration test runs with `case_id=None` against the pure base world. The `case_id != None` merge paths and `PING_SUPPRESSION` handling are still implemented and unit-tested with synthetic data, but full case-merge integration coverage lands in Plan 03. State this in each affected tool's module docstring.
- **Sentinels, exact strings:** `"NO MATCH FOUND"` (biometrics; `query_telecom` subscriber miss; ANPR total miss), `"NO COVERAGE"` (`search_cctv` unknown/absent camera), `[]` (any tool whose success shape is a list and the result set is empty). Never return `None`, `{}` , or an empty string as a "no result".
- **SQL:** parameterised only — `sqlalchemy.text()` with bound `:params`, or SQLAlchemy `select()`. **Never** build SQL with f-strings, `%`, `.format()`, or string concatenation, including for table/column names. Where a query needs one of several `WHERE` shapes (e.g. `scan_financials` by account vs ATM vs citizen), write several separate complete `text()` constants — do not template one string.
- **Timestamps:** tools accept ISO-8601 strings (the model emits these) or `datetime`; parse to timezone-aware UTC via `_common.parse_ts` before querying. All DB timestamps are `timestamptz`.
- **Return values are JSON-serialisable:** `uuid` → `str`, `datetime` → `.isoformat()`, `Decimal` → `float`, Postgres arrays → `list`. No SQLAlchemy `Row` / `Mapping` objects escape a tool.
- **`rapidfuzz==3.11.0`** added to `backend/requirements.txt`.
- **Tests:** any test that opens a DB session is `@pytest.mark.slow` and uses the `db` fixture (added in Task 1). Pure-logic tests (`_common` helpers, `registry_schema` shape) are **not** marked slow. The `db` fixture skips when no `DATABASE_URL` and seeds the world once per session if `citizens` count ≠ 1000.
- Determinism note: seed 42 makes row *values* stable, but `citizen_id` etc. are random UUIDs. Integration tests must **derive** expected keys by querying the seeded DB (e.g. `SELECT fingerprint_hash FROM criminal_records LIMIT 1`), never hard-code a UUID.
- No secrets. `.env` stays git-ignored. Every task ends with a passing test run and a commit. TDD: failing test first (superpowers:test-driven-development).

---

## File Structure

```
backend/
├── app/
│   └── tools/
│       ├── __init__.py          # empty
│       ├── _common.py           # parse_ts(), hamming_hex(), CASE_PRED constant
│       ├── registry.py          # search_civil_registry
│       ├── biometric.py         # match_biometrics
│       ├── telecom.py           # query_telecom (+ _suppressed helper)
│       ├── cctv.py              # search_cctv
│       ├── financial.py         # scan_financials
│       ├── anpr.py              # lookup_vehicle_anpr
│       ├── digital.py           # pivot_digital_identity
│       └── registry_schema.py   # FUNCTION_DECLARATIONS, TOOL_REGISTRY, dispatch_tool
├── tests/
│   ├── conftest.py              # + _seeded (session) and db (function) fixtures
│   ├── test_tools_common.py     # non-slow
│   ├── test_tool_registry_search.py
│   ├── test_tool_biometric.py   # slow + non-slow (hamming/dna ratio)
│   ├── test_tool_telecom.py
│   ├── test_tool_cctv.py
│   ├── test_tool_financial.py
│   ├── test_tool_anpr.py
│   ├── test_tool_digital.py
│   └── test_tool_registry_schema.py  # non-slow
└── requirements.txt             # + rapidfuzz
```

Each tool file: one responsibility, module docstring stating tables touched + the Plan-02 "cases empty, `case_id=None` path only" caveat.

---

## Task 1: Tools package, shared helpers, DB test fixture, `rapidfuzz`

**Files:**
- Create: `backend/app/tools/__init__.py`, `backend/app/tools/_common.py`
- Modify: `backend/requirements.txt` (add `rapidfuzz==3.11.0`)
- Modify: `backend/tests/conftest.py` (add `_seeded`, `db` fixtures)
- Create: `backend/tests/test_tools_common.py`

**Interfaces:**
- Consumes: `app.db.SessionLocal`, `seed.seed_world.run`.
- Produces:
  - `app.tools._common.parse_ts(value: str | datetime) -> datetime` — tz-aware UTC; accepts `...Z`, `+00:00`, or naive (assumed UTC); raises `ValueError` on unparseable input.
  - `app.tools._common.hamming_hex(a: str, b: str) -> int` — bit-count of `int(a,16) ^ int(b,16)` per nibble; on length mismatch returns `max(len(a), len(b)) * 4` (a guaranteed non-match).
  - `app.tools._common.CASE_PRED: str` — the literal `"(case_id IS NULL OR case_id = :case_id)"` for reuse in `text()` bodies.
  - pytest fixtures: `_seeded` (session-scoped; `pytest.skip` without `DATABASE_URL`; seeds once if `citizens` ≠ 1000; returns `True`), `db` (function-scoped `Session`, rolled back + closed in teardown; depends on `_seeded`).

- [ ] **Step 1: Add `rapidfuzz` to `requirements.txt`**

Append the line `rapidfuzz==3.11.0` to `backend/requirements.txt`, then `backend/.venv/Scripts/python.exe -m pip install rapidfuzz==3.11.0`.

- [ ] **Step 2: Write the failing test — `backend/tests/test_tools_common.py`**

```python
from datetime import datetime, timezone

import pytest

from app.tools._common import parse_ts, hamming_hex, CASE_PRED


def test_parse_ts_handles_z_suffix():
    dt = parse_ts("2026-09-01T22:30:00Z")
    assert dt == datetime(2026, 9, 1, 22, 30, tzinfo=timezone.utc)
    assert dt.tzinfo is not None


def test_parse_ts_assumes_utc_for_naive():
    assert parse_ts("2026-09-01 22:30:00").tzinfo == timezone.utc


def test_parse_ts_passthrough_datetime_naive_gets_utc():
    naive = datetime(2026, 9, 1, 22, 30)
    assert parse_ts(naive).tzinfo == timezone.utc


def test_parse_ts_rejects_garbage():
    with pytest.raises(ValueError):
        parse_ts("not a date")


def test_hamming_hex_zero_for_identical():
    assert hamming_hex("abcd1234", "abcd1234") == 0


def test_hamming_hex_counts_bit_differences():
    # 0x0 ^ 0x1 = 1 bit; 0xf ^ 0x0 = 4 bits
    assert hamming_hex("0f", "10") == 1 + 4


def test_hamming_hex_length_mismatch_is_large():
    assert hamming_hex("ab", "abcd") == 16  # max(2,4)*4


def test_case_pred_literal():
    assert CASE_PRED == "(case_id IS NULL OR case_id = :case_id)"
```

- [ ] **Step 3: Run — verify it fails**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tools_common.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.tools'`

- [ ] **Step 4: Write `app/tools/__init__.py`** (empty file) and **`app/tools/_common.py`**

```python
"""Shared pure helpers for the forensic tools. No DB access here."""
from datetime import datetime, timezone

CASE_PRED = "(case_id IS NULL OR case_id = :case_id)"


def parse_ts(value: "str | datetime") -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    s = str(value).strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)  # raises ValueError on garbage
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def hamming_hex(a: str, b: str) -> int:
    """Bitwise Hamming distance between two equal-length hex strings.
    On length mismatch returns a guaranteed-non-match value."""
    if len(a) != len(b):
        return max(len(a), len(b)) * 4
    total = 0
    for x, y in zip(a, b):
        total += bin(int(x, 16) ^ int(y, 16)).count("1")
    return total
```

- [ ] **Step 5: Add fixtures to `backend/tests/conftest.py`**

Append (keep the existing `has_db` / `engine` / `db_session` fixtures untouched):

```python
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
```

- [ ] **Step 6: Run tests — verify pass**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tools_common.py -v`
Expected: PASS (8 passed). No DB needed for this file.

Run: `cd backend && .venv/Scripts/python.exe -m pytest -q -m "not slow"`
Expected: the full prior non-slow suite + 8 new, all green (state the exact number in the report).

- [ ] **Step 7: Commit**

```bash
git add backend/app/tools/ backend/tests/test_tools_common.py backend/tests/conftest.py backend/requirements.txt
git commit -m "feat(tools): tools package, pure helpers (parse_ts, hamming_hex), seeded DB test fixture"
```

---

## Task 2: `search_civil_registry`

**Files:**
- Create: `backend/app/tools/registry.py`
- Create: `backend/tests/test_tool_registry_search.py`

**Interfaces:**
- Consumes: a `Session`.
- Produces: `search_civil_registry(session, query: str, search_type: str = "auto", *, case_id: str | None = None) -> list[dict]`. Each dict: `{citizen_id, full_name, aliases, dob, gender, address, address_updated_year, legal_status, national_id_present, has_criminal_record, phone_number, registered_plate, match_score}`. Empty result → `[]`. `citizens` has no `case_id` column, so `case_id` is accepted but unused (documented).

- [ ] **Step 1: Write the failing test — `backend/tests/test_tool_registry_search.py`**

```python
import json

import pytest
from sqlalchemy import text

from app.tools.registry import search_civil_registry

pytestmark = pytest.mark.slow


def test_search_by_partial_name_returns_scored_matches(db):
    real_name = db.execute(text("SELECT full_name FROM citizens LIMIT 1")).scalar()
    token = real_name.split()[-1]  # surname
    rows = search_civil_registry(db, token, "name")
    assert isinstance(rows, list) and rows
    assert any(token.lower() in r["full_name"].lower() for r in rows)
    assert all(0.0 <= r["match_score"] <= 1.0 for r in rows)
    assert rows == sorted(rows, key=lambda r: r["match_score"], reverse=True)
    assert len(rows) <= 25


def test_search_result_is_fully_json_serialisable(db):
    name = db.execute(text("SELECT full_name FROM citizens LIMIT 1")).scalar()
    rows = search_civil_registry(db, name.split()[0], "name")
    json.dumps(rows)  # must not raise
    r = rows[0]
    assert isinstance(r["citizen_id"], str)
    assert isinstance(r["dob"], str)
    assert isinstance(r["national_id_present"], bool)
    assert isinstance(r["has_criminal_record"], bool)


def test_search_by_address(db):
    addr = db.execute(text("SELECT address FROM citizens LIMIT 1")).scalar()
    token = addr.split()[0]
    rows = search_civil_registry(db, token, "address")
    assert isinstance(rows, list)


def test_search_no_match_returns_empty_list(db):
    assert search_civil_registry(db, "Zzxqwv Nonexistent Qqq", "name") == []


def test_has_criminal_record_flag_is_accurate(db):
    cid = db.execute(text("SELECT citizen_id FROM criminal_records LIMIT 1")).scalar()
    name = db.execute(text("SELECT full_name FROM citizens WHERE citizen_id = :c"),
                      {"c": cid}).scalar()
    rows = search_civil_registry(db, name, "name")
    hit = next((r for r in rows if r["citizen_id"] == str(cid)), None)
    assert hit is not None and hit["has_criminal_record"] is True
```

- [ ] **Step 2: Run — verify it fails**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_registry_search.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.tools.registry'`. (With no DB, all skip — report the task as blocked-on-db.)

- [ ] **Step 3: Write `app/tools/registry.py`**

```python
"""search_civil_registry — fuzzy identity/address lookup over `citizens`.

Tables: citizens (+ criminal_records existence flag). No case_id column on
citizens, so the case_id argument is accepted for interface uniformity but
unused. pg_trgm `similarity()` drives ranking (threshold 0.3)."""
from sqlalchemy import text
from sqlalchemy.orm import Session

_SQL = text(
    """
    SELECT c.citizen_id, c.full_name, c.aliases, c.dob, c.gender, c.address,
           c.address_updated_year, c.legal_status, c.phone_number, c.registered_plate,
           (c.national_id IS NOT NULL) AS national_id_present,
           EXISTS (SELECT 1 FROM criminal_records cr WHERE cr.citizen_id = c.citizen_id)
               AS has_criminal_record,
           GREATEST(
               similarity(c.full_name, :q),
               similarity(c.address, :q),
               similarity(array_to_string(c.aliases, ' '), :q)
           ) AS score
    FROM citizens c
    WHERE (:mode IN ('name', 'auto')    AND similarity(c.full_name, :q) > 0.3)
       OR (:mode IN ('address', 'auto') AND similarity(c.address, :q) > 0.3)
       OR (:mode = 'auto' AND similarity(array_to_string(c.aliases, ' '), :q) > 0.3)
    ORDER BY score DESC
    LIMIT 25
    """
)


def search_civil_registry(session: Session, query: str, search_type: str = "auto",
                          *, case_id: "str | None" = None) -> list[dict]:
    mode = search_type if search_type in ("auto", "name", "address") else "auto"
    rows = session.execute(_SQL, {"q": query, "mode": mode}).mappings().all()
    return [
        {
            "citizen_id": str(r["citizen_id"]),
            "full_name": r["full_name"],
            "aliases": list(r["aliases"] or []),
            "dob": r["dob"].isoformat(),
            "gender": r["gender"],
            "address": r["address"],
            "address_updated_year": r["address_updated_year"],
            "legal_status": r["legal_status"],
            "national_id_present": bool(r["national_id_present"]),
            "has_criminal_record": bool(r["has_criminal_record"]),
            "phone_number": r["phone_number"],
            "registered_plate": r["registered_plate"],
            "match_score": round(float(r["score"] or 0.0), 3),
        }
        for r in rows
    ]
```

- [ ] **Step 4: Run — verify pass**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_registry_search.py -v`
Expected: PASS (5 passed). Requires `DATABASE_URL` + `pg_trgm`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/tools/registry.py backend/tests/test_tool_registry_search.py
git commit -m "feat(tools): search_civil_registry — pg_trgm fuzzy name/address lookup"
```

---

## Task 3: `match_biometrics`

**Files:**
- Create: `backend/app/tools/biometric.py`
- Create: `backend/tests/test_tool_biometric.py`

**Interfaces:**
- Consumes: `_common.hamming_hex`, `rapidfuzz.fuzz.ratio`, a `Session`.
- Produces: `match_biometrics(session, sample_type: str, sample_data: str, *, case_id=None) -> dict | str`.
  - `sample_type` (case-insensitive) ∈ `{"fingerprint", "dna"}`; anything else → `"NO MATCH FOUND"`.
  - fingerprint: best `criminal_records` row with `hamming_hex(sample, row) <= 6`; confidence `1 - h/64`.
  - dna: best row with `rapidfuzz ratio(sample, row)/100 >= 0.90`; confidence = that ratio.
  - hit → `{"match": True, "citizen_id": str, "confidence": float(3dp), "priors_summary": str}`; miss → `"NO MATCH FOUND"`.
  - `criminal_records` has no `case_id`; argument accepted, unused.

- [ ] **Step 1: Write the failing test — `backend/tests/test_tool_biometric.py`**

```python
import pytest
from sqlalchemy import text

from app.tools.biometric import match_biometrics


def test_unknown_sample_type_returns_sentinel():
    # pure — no DB needed
    assert match_biometrics(None, "retina", "whatever") == "NO MATCH FOUND"


@pytest.mark.slow
def test_exact_fingerprint_hash_matches_its_owner(db):
    row = db.execute(text(
        "SELECT citizen_id, fingerprint_hash FROM criminal_records LIMIT 1")).mappings().first()
    res = match_biometrics(db, "fingerprint", row["fingerprint_hash"])
    assert isinstance(res, dict)
    assert res["match"] is True
    assert res["citizen_id"] == str(row["citizen_id"])
    assert res["confidence"] == 1.0
    assert isinstance(res["priors_summary"], str) and res["priors_summary"]


@pytest.mark.slow
def test_near_fingerprint_within_hamming_6_still_matches(db):
    h = db.execute(text("SELECT fingerprint_hash FROM criminal_records LIMIT 1")).scalar()
    # flip one nibble (1 bit) — still <= 6
    idx = next(i for i, ch in enumerate(h) if ch in "0189")
    flipped = h[:idx] + {"0": "1", "1": "0", "8": "9", "9": "8"}[h[idx]] + h[idx + 1:]
    res = match_biometrics(db, "fingerprint", flipped)
    assert isinstance(res, dict) and res["match"] is True
    assert 0.9 <= res["confidence"] < 1.0


@pytest.mark.slow
def test_random_fingerprint_returns_sentinel(db):
    assert match_biometrics(db, "fingerprint", "0" * 64) == "NO MATCH FOUND"


@pytest.mark.slow
def test_exact_dna_string_matches(db):
    row = db.execute(text(
        "SELECT citizen_id, dna_string FROM criminal_records LIMIT 1")).mappings().first()
    res = match_biometrics(db, "DNA", row["dna_string"])
    assert res["match"] is True and res["citizen_id"] == str(row["citizen_id"])
    assert res["confidence"] >= 0.9


@pytest.mark.slow
def test_dissimilar_dna_returns_sentinel(db):
    assert match_biometrics(db, "dna", "A" * 100) == "NO MATCH FOUND"
```

- [ ] **Step 2: Run — verify it fails**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_biometric.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.tools.biometric'` (`test_unknown_sample_type_returns_sentinel` is non-slow and also fails on the import).

- [ ] **Step 3: Write `app/tools/biometric.py`**

```python
"""match_biometrics — latent print / DNA comparison against `criminal_records`
(~45 rows). No case_id column; argument accepted, unused."""
from rapidfuzz.fuzz import ratio
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.tools._common import hamming_hex

_ALL = text("SELECT citizen_id, priors_summary, fingerprint_hash, dna_string FROM criminal_records")

_FP_MAX_HAMMING = 6
_DNA_MIN_RATIO = 0.90


def match_biometrics(session: Session, sample_type: str, sample_data: str,
                     *, case_id: "str | None" = None) -> "dict | str":
    st = (sample_type or "").strip().lower()
    if st not in ("fingerprint", "dna"):
        return "NO MATCH FOUND"
    rows = session.execute(_ALL).mappings().all()
    sample = (sample_data or "").strip()
    best_row = None
    best_conf = 0.0
    if st == "fingerprint":
        s = sample.lower()
        for r in rows:
            h = hamming_hex(s, r["fingerprint_hash"].lower())
            if h <= _FP_MAX_HAMMING:
                conf = 1.0 - h / 64.0
                if conf > best_conf:
                    best_row, best_conf = r, conf
    else:
        s = sample.upper()
        for r in rows:
            sim = ratio(s, r["dna_string"].upper()) / 100.0
            if sim >= _DNA_MIN_RATIO and sim > best_conf:
                best_row, best_conf = r, sim
    if best_row is None:
        return "NO MATCH FOUND"
    return {
        "match": True,
        "citizen_id": str(best_row["citizen_id"]),
        "confidence": round(best_conf, 3),
        "priors_summary": best_row["priors_summary"],
    }
```

- [ ] **Step 4: Run — verify pass**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_biometric.py -v`
Expected: PASS (6 passed; 1 non-slow + 5 slow).

- [ ] **Step 5: Commit**

```bash
git add backend/app/tools/biometric.py backend/tests/test_tool_biometric.py
git commit -m "feat(tools): match_biometrics — fingerprint Hamming + DNA rapidfuzz against criminal_records"
```

---

## Task 4: `query_telecom`

**Files:**
- Create: `backend/app/tools/telecom.py`
- Create: `backend/tests/test_tool_telecom.py`

**Interfaces:**
- Consumes: `_common.parse_ts`, a `Session`.
- Produces: `query_telecom(session, target: str, mode: str, start_time, end_time, *, case_id=None) -> list[dict] | dict | str`.
  - `mode == "tower_dump"`: `target` is a `tower_id`. List of `{phone_number, first_seen, last_seen, ping_count, min_signal_dbm, max_signal_dbm}` for phones with a `cell_pings` row on that tower in `[start,end]`, ordered by `ping_count` desc. Rows hidden by an active-case `PING_SUPPRESSION` marker are removed **before** aggregation. Empty → `[]`.
  - `mode == "call_log"`: `target` is a phone number. List of `{caller_num, receiver_num, start_time, duration_sec, is_sms, counterparty_is_prepaid_burner}` in the window, ordered by time. Empty → `[]`.
  - `mode == "subscriber"`: `target` is a phone number. `{phone_number, subscriber_name, is_prepaid, linked_citizen_id}` or `"NO MATCH FOUND"`.
  - any other `mode` → `"NO MATCH FOUND"`.
  - `_suppressed(phone, first_seen, last_seen, markers) -> bool` — a marker `{phone_number, start, end}` suppresses when the phone matches and `[first_seen,last_seen]` overlaps `[start,end]`.

- [ ] **Step 1: Write the failing test — `backend/tests/test_tool_telecom.py`**

```python
import json

import pytest
from sqlalchemy import text

from app.tools.telecom import query_telecom, _suppressed
from app.tools._common import parse_ts


def test_suppressed_overlap_logic():
    m = [{"phone_number": "+447000", "start": "2026-09-01T22:00:00Z", "end": "2026-09-01T23:00:00Z"}]
    assert _suppressed("+447000", parse_ts("2026-09-01T22:30:00Z"),
                       parse_ts("2026-09-01T22:45:00Z"), m) is True
    assert _suppressed("+447000", parse_ts("2026-09-01T23:30:00Z"),
                       parse_ts("2026-09-01T23:45:00Z"), m) is False
    assert _suppressed("+447999", parse_ts("2026-09-01T22:30:00Z"),
                       parse_ts("2026-09-01T22:45:00Z"), m) is False


@pytest.mark.slow
def test_tower_dump_lists_phones_active_in_window(db):
    tw, t0, t1 = db.execute(text(
        "SELECT tower_id, min(ping_time), max(ping_time) FROM cell_pings "
        "WHERE case_id IS NULL GROUP BY tower_id LIMIT 1")).first()
    rows = query_telecom(db, tw, "tower_dump", t0.isoformat(), t1.isoformat())
    assert isinstance(rows, list) and rows
    assert all(set(r) == {"phone_number", "first_seen", "last_seen",
                          "ping_count", "min_signal_dbm", "max_signal_dbm"} for r in rows)
    assert rows == sorted(rows, key=lambda r: r["ping_count"], reverse=True)
    json.dumps(rows)


@pytest.mark.slow
def test_call_log_for_a_real_number(db):
    num = db.execute(text("SELECT caller_num FROM call_records WHERE case_id IS NULL LIMIT 1")).scalar()
    t0, t1 = db.execute(text(
        "SELECT min(start_time), max(start_time) FROM call_records WHERE caller_num = :n"),
        {"n": num}).first()
    rows = query_telecom(db, num, "call_log", t0.isoformat(), t1.isoformat())
    assert isinstance(rows, list) and rows
    assert all(r["caller_num"] == num or r["receiver_num"] == num for r in rows)
    assert all(isinstance(r["counterparty_is_prepaid_burner"], bool) for r in rows)


@pytest.mark.slow
def test_subscriber_resolves_and_misses(db):
    num = db.execute(text("SELECT phone_number FROM phones WHERE case_id IS NULL LIMIT 1")).scalar()
    res = query_telecom(db, num, "subscriber", "2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z")
    assert res["phone_number"] == num
    assert isinstance(res["is_prepaid"], bool)
    assert query_telecom(db, "+440000000000", "subscriber",
                         "2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z") == "NO MATCH FOUND"


@pytest.mark.slow
def test_bad_mode_returns_sentinel(db):
    assert query_telecom(db, "TOWER-1", "wiretap",
                         "2026-09-01T00:00:00Z", "2026-09-02T00:00:00Z") == "NO MATCH FOUND"
```

- [ ] **Step 2: Run — verify it fails**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_telecom.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.tools.telecom'`

- [ ] **Step 3: Write `app/tools/telecom.py`**

```python
"""query_telecom — tower dumps, call logs, subscriber lookups over
`cell_pings`, `call_records`, `phones`. Case-aware: the case_id predicate is
applied to all three; active-case PING_SUPPRESSION markers remove individual
ping rows before a tower dump aggregates. In Plan 02 case_evidence is empty,
so the suppression path is exercised only by unit tests."""
from collections import defaultdict

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.tools._common import parse_ts

_RAW_PINGS = text(
    """
    SELECT phone_number, ping_time, signal_strength_dbm
    FROM cell_pings
    WHERE tower_id = :target
      AND ping_time >= :start AND ping_time <= :end
      AND (case_id IS NULL OR case_id = :case_id)
    """
)

_SUPPRESSIONS = text(
    """
    SELECT payload_json
    FROM case_evidence
    WHERE case_id = :case_id AND evidence_type = 'PING_SUPPRESSION'
    """
)

_CALL_LOG = text(
    """
    SELECT cr.caller_num, cr.receiver_num, cr.start_time, cr.duration_sec, cr.is_sms,
           op.is_prepaid AS other_is_prepaid
    FROM call_records cr
    LEFT JOIN phones op
      ON op.phone_number = CASE WHEN cr.caller_num = :target
                                THEN cr.receiver_num ELSE cr.caller_num END
     AND (op.case_id IS NULL OR op.case_id = :case_id)
    WHERE (cr.caller_num = :target OR cr.receiver_num = :target)
      AND cr.start_time >= :start AND cr.start_time <= :end
      AND (cr.case_id IS NULL OR cr.case_id = :case_id)
    ORDER BY cr.start_time
    """
)

_SUBSCRIBER = text(
    """
    SELECT phone_number, subscriber_name, is_prepaid, citizen_id
    FROM phones
    WHERE phone_number = :target AND (case_id IS NULL OR case_id = :case_id)
    LIMIT 1
    """
)


def _suppressed(phone, first_seen, last_seen, markers) -> bool:
    for m in markers:
        if m.get("phone_number") != phone:
            continue
        ms, me = parse_ts(m["start"]), parse_ts(m["end"])
        if first_seen <= me and last_seen >= ms:
            return True
    return False


def query_telecom(session: Session, target: str, mode: str, start_time, end_time,
                  *, case_id: "str | None" = None) -> "list[dict] | dict | str":
    start, end = parse_ts(start_time), parse_ts(end_time)
    params = {"target": target, "start": start, "end": end, "case_id": case_id}

    if mode == "tower_dump":
        markers = []
        if case_id:
            markers = [m["payload_json"] for m in
                       session.execute(_SUPPRESSIONS, {"case_id": case_id}).mappings().all()]
        agg = defaultdict(lambda: {"count": 0, "first": None, "last": None,
                                   "min_sig": None, "max_sig": None})
        for r in session.execute(_RAW_PINGS, params).mappings():
            a = agg[r["phone_number"]]
            a["count"] += 1
            a["first"] = r["ping_time"] if a["first"] is None else min(a["first"], r["ping_time"])
            a["last"] = r["ping_time"] if a["last"] is None else max(a["last"], r["ping_time"])
            s = r["signal_strength_dbm"]
            a["min_sig"] = s if a["min_sig"] is None else min(a["min_sig"], s)
            a["max_sig"] = s if a["max_sig"] is None else max(a["max_sig"], s)
        out = []
        for phone, a in agg.items():
            if markers and _suppressed(phone, a["first"], a["last"], markers):
                continue
            out.append({
                "phone_number": phone,
                "first_seen": a["first"].isoformat(),
                "last_seen": a["last"].isoformat(),
                "ping_count": a["count"],
                "min_signal_dbm": a["min_sig"],
                "max_signal_dbm": a["max_sig"],
            })
        out.sort(key=lambda r: r["ping_count"], reverse=True)
        return out

    if mode == "call_log":
        rows = session.execute(_CALL_LOG, params).mappings().all()
        return [
            {
                "caller_num": r["caller_num"],
                "receiver_num": r["receiver_num"],
                "start_time": r["start_time"].isoformat(),
                "duration_sec": r["duration_sec"],
                "is_sms": bool(r["is_sms"]),
                "counterparty_is_prepaid_burner": bool(r["other_is_prepaid"]),
            }
            for r in rows
        ]

    if mode == "subscriber":
        r = session.execute(_SUBSCRIBER, params).mappings().first()
        if not r:
            return "NO MATCH FOUND"
        return {
            "phone_number": r["phone_number"],
            "subscriber_name": r["subscriber_name"],
            "is_prepaid": bool(r["is_prepaid"]),
            "linked_citizen_id": str(r["citizen_id"]) if r["citizen_id"] else None,
        }

    return "NO MATCH FOUND"
```

- [ ] **Step 4: Run — verify pass**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_telecom.py -v`
Expected: PASS (5 passed; 1 non-slow + 4 slow).

- [ ] **Step 5: Commit**

```bash
git add backend/app/tools/telecom.py backend/tests/test_tool_telecom.py
git commit -m "feat(tools): query_telecom — tower dump / call log / subscriber, with ping-suppression"
```

---

## Task 5: `search_cctv`

**Files:**
- Create: `backend/app/tools/cctv.py`
- Create: `backend/tests/test_tool_cctv.py`

**Interfaces:**
- Consumes: `_common.parse_ts`, a `Session`.
- Produces: `search_cctv(session, camera_id: str, start_time, end_time, filter_tags: list[str] | None = None, *, case_id=None) -> dict | str`.
  - Unknown `camera_id` (no `cctv_cameras` row) → `"NO COVERAGE"`.
  - Otherwise `{"camera_id", "coverage_desc", "sightings": [ {seen_time, detected_height_cm, clothing_tags, face_confidence, citizen_id} ... ]}`. `face_confidence` as `float`. `citizen_id` → `str` or `None`.
  - `filter_tags` (case-insensitive): keep a sighting only if its `clothing_tags` intersect the filter set. Empty/omitted filter → no filtering. Zero sightings → `sightings: []` (the camera exists — not `"NO COVERAGE"`).

- [ ] **Step 1: Write the failing test — `backend/tests/test_tool_cctv.py`**

```python
import json

import pytest
from sqlalchemy import text

from app.tools.cctv import search_cctv

pytestmark = pytest.mark.slow


def test_unknown_camera_returns_no_coverage(db):
    assert search_cctv(db, "CAM-999", "2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z") == "NO COVERAGE"


def test_known_camera_returns_sightings_in_window(db):
    cam, t0, t1 = db.execute(text(
        "SELECT camera_id, min(seen_time), max(seen_time) FROM cctv_sightings "
        "WHERE case_id IS NULL GROUP BY camera_id LIMIT 1")).first()
    res = search_cctv(db, cam, t0.isoformat(), t1.isoformat())
    assert res["camera_id"] == cam
    assert isinstance(res["coverage_desc"], str) and res["coverage_desc"]
    assert res["sightings"] and all(
        set(s) == {"seen_time", "detected_height_cm", "clothing_tags",
                   "face_confidence", "citizen_id"} for s in res["sightings"])
    assert all(isinstance(s["face_confidence"], float) for s in res["sightings"])
    json.dumps(res)


def test_clothing_tag_filter(db):
    cam = db.execute(text(
        "SELECT camera_id FROM cctv_sightings WHERE case_id IS NULL LIMIT 1")).scalar()
    tag = db.execute(text(
        "SELECT clothing_tags[1] FROM cctv_sightings "
        "WHERE case_id IS NULL AND array_length(clothing_tags,1) >= 1 LIMIT 1")).scalar()
    res = search_cctv(db, cam, "2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z", [tag.upper()])
    assert all(any(t.lower() == tag.lower() for t in s["clothing_tags"])
               for s in res["sightings"])


def test_known_camera_empty_window_returns_empty_sightings_not_sentinel(db):
    cam = db.execute(text("SELECT camera_id FROM cctv_cameras LIMIT 1")).scalar()
    res = search_cctv(db, cam, "1999-01-01T00:00:00Z", "1999-01-02T00:00:00Z")
    assert res["camera_id"] == cam and res["sightings"] == []
```

- [ ] **Step 2: Run — verify it fails**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_cctv.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.tools.cctv'`

- [ ] **Step 3: Write `app/tools/cctv.py`**

```python
"""search_cctv — camera-window sighting search over `cctv_cameras` +
`cctv_sightings`. case_id predicate on sightings only. Unknown camera →
"NO COVERAGE"; known camera with no sightings → sightings: []."""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.tools._common import parse_ts

_CAM = text("SELECT camera_id, coverage_desc FROM cctv_cameras WHERE camera_id = :cam")

_SIGHT = text(
    """
    SELECT seen_time, detected_height_cm, clothing_tags, face_confidence, citizen_id
    FROM cctv_sightings
    WHERE camera_id = :cam
      AND seen_time >= :start AND seen_time <= :end
      AND (case_id IS NULL OR case_id = :case_id)
    ORDER BY seen_time
    """
)


def search_cctv(session: Session, camera_id: str, start_time, end_time,
                filter_tags: "list[str] | None" = None, *, case_id: "str | None" = None) -> "dict | str":
    cam = session.execute(_CAM, {"cam": camera_id}).mappings().first()
    if not cam:
        return "NO COVERAGE"
    start, end = parse_ts(start_time), parse_ts(end_time)
    rows = session.execute(
        _SIGHT, {"cam": camera_id, "start": start, "end": end, "case_id": case_id}
    ).mappings().all()
    wanted = {t.lower() for t in (filter_tags or [])}
    sightings = []
    for r in rows:
        tags = list(r["clothing_tags"] or [])
        if wanted and not (wanted & {t.lower() for t in tags}):
            continue
        sightings.append({
            "seen_time": r["seen_time"].isoformat(),
            "detected_height_cm": r["detected_height_cm"],
            "clothing_tags": tags,
            "face_confidence": float(r["face_confidence"]),
            "citizen_id": str(r["citizen_id"]) if r["citizen_id"] else None,
        })
    return {"camera_id": camera_id, "coverage_desc": cam["coverage_desc"], "sightings": sightings}
```

- [ ] **Step 4: Run — verify pass**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_cctv.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/app/tools/cctv.py backend/tests/test_tool_cctv.py
git commit -m "feat(tools): search_cctv — camera-window sighting search with clothing-tag filter"
```

---

## Task 6: `scan_financials`

**Files:**
- Create: `backend/app/tools/financial.py`
- Create: `backend/tests/test_tool_financial.py`

**Interfaces:**
- Consumes: `_common.parse_ts`, `uuid`, a `Session`.
- Produces: `scan_financials(session, target: str, start_time, end_time, *, case_id=None) -> dict`.
  - `target` kind: valid UUID → `citizen_id` (resolve to `bank_accounts.account_id`s); starts with `ATM-` (case-insensitive) → `atm_id`; otherwise → `account_id`.
  - `{"transactions": [ {tx_id, account_id, merchant_name, merchant_category, amount, tx_time, atm_id, is_cash_withdrawal, terminal_lat, terminal_lon} ... ], "flags": [str…]}` ordered by `tx_time`.
  - `flags`: `"large_cash_withdrawal"` if any tx has `is_cash_withdrawal` and `amount >= 150`; `"suspicious_category"` if any tx `merchant_category` ∈ `{"HARDWARE", "PHARMACY"}`.
  - Unknown target → `{"transactions": [], "flags": []}` (a dict — the success shape is a dict, never a sentinel string).

- [ ] **Step 1: Write the failing test — `backend/tests/test_tool_financial.py`**

```python
import json

import pytest
from sqlalchemy import text

from app.tools.financial import scan_financials

pytestmark = pytest.mark.slow


def test_scan_by_account_id(db):
    acct = db.execute(text(
        "SELECT account_id FROM financial_transactions WHERE case_id IS NULL LIMIT 1")).scalar()
    res = scan_financials(db, acct, "2026-09-01T00:00:00Z", "2026-09-08T23:59:59Z")
    assert isinstance(res, dict) and res["transactions"]
    assert all(t["account_id"] == acct for t in res["transactions"])
    assert res["transactions"] == sorted(res["transactions"], key=lambda t: t["tx_time"])
    assert all(isinstance(t["amount"], float) for t in res["transactions"])
    json.dumps(res)


def test_scan_by_citizen_id_aggregates_their_accounts(db):
    cid = db.execute(text(
        "SELECT ba.citizen_id FROM bank_accounts ba "
        "JOIN financial_transactions ft ON ft.account_id = ba.account_id LIMIT 1")).scalar()
    res = scan_financials(db, str(cid), "2026-09-01T00:00:00Z", "2026-09-08T23:59:59Z")
    assert res["transactions"]


def test_scan_by_atm_id(db):
    atm = db.execute(text(
        "SELECT atm_id FROM financial_transactions WHERE atm_id IS NOT NULL LIMIT 1")).scalar()
    res = scan_financials(db, atm, "2026-09-01T00:00:00Z", "2026-09-08T23:59:59Z")
    assert res["transactions"] and all(t["atm_id"] == atm for t in res["transactions"])


def test_unknown_target_returns_empty_dict_not_sentinel(db):
    res = scan_financials(db, "AC0000000000", "2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z")
    assert res == {"transactions": [], "flags": []}
```

- [ ] **Step 2: Run — verify it fails**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_financial.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.tools.financial'`

- [ ] **Step 3: Write `app/tools/financial.py`**

```python
"""scan_financials — card/ATM transaction scan over `financial_transactions`
(+ `bank_accounts` to resolve a citizen). case_id predicate on transactions.
Three target kinds, three separate complete parameterised queries — no SQL
templating."""
import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.tools._common import parse_ts

_ACCOUNTS_FOR_CITIZEN = text("SELECT account_id FROM bank_accounts WHERE citizen_id = :cid")

_BY_ACCOUNTS = text(
    """
    SELECT tx_id, account_id, merchant_name, merchant_category, amount, tx_time,
           atm_id, is_cash_withdrawal, terminal_lat, terminal_lon
    FROM financial_transactions
    WHERE account_id = ANY(:accts)
      AND tx_time >= :start AND tx_time <= :end
      AND (case_id IS NULL OR case_id = :case_id)
    ORDER BY tx_time
    """
)

_BY_ATM = text(
    """
    SELECT tx_id, account_id, merchant_name, merchant_category, amount, tx_time,
           atm_id, is_cash_withdrawal, terminal_lat, terminal_lon
    FROM financial_transactions
    WHERE atm_id = :t
      AND tx_time >= :start AND tx_time <= :end
      AND (case_id IS NULL OR case_id = :case_id)
    ORDER BY tx_time
    """
)

_BY_ACCOUNT = text(
    """
    SELECT tx_id, account_id, merchant_name, merchant_category, amount, tx_time,
           atm_id, is_cash_withdrawal, terminal_lat, terminal_lon
    FROM financial_transactions
    WHERE account_id = :t
      AND tx_time >= :start AND tx_time <= :end
      AND (case_id IS NULL OR case_id = :case_id)
    ORDER BY tx_time
    """
)

_SUSPICIOUS_CATEGORIES = {"HARDWARE", "PHARMACY"}


def _kind(target: str) -> str:
    try:
        uuid.UUID(str(target))
        return "citizen"
    except (ValueError, AttributeError, TypeError):
        return "atm" if str(target).upper().startswith("ATM-") else "account"


def scan_financials(session: Session, target: str, start_time, end_time,
                    *, case_id: "str | None" = None) -> dict:
    start, end = parse_ts(start_time), parse_ts(end_time)
    kind = _kind(target)
    if kind == "citizen":
        accts = [row[0] for row in session.execute(_ACCOUNTS_FOR_CITIZEN, {"cid": str(target)})]
        if not accts:
            return {"transactions": [], "flags": []}
        result = session.execute(
            _BY_ACCOUNTS, {"accts": accts, "start": start, "end": end, "case_id": case_id})
    elif kind == "atm":
        result = session.execute(
            _BY_ATM, {"t": str(target).upper(), "start": start, "end": end, "case_id": case_id})
    else:
        result = session.execute(
            _BY_ACCOUNT, {"t": target, "start": start, "end": end, "case_id": case_id})

    txs = []
    flags = set()
    for r in result.mappings():
        amount = float(r["amount"])
        if r["is_cash_withdrawal"] and amount >= 150:
            flags.add("large_cash_withdrawal")
        if r["merchant_category"] in _SUSPICIOUS_CATEGORIES:
            flags.add("suspicious_category")
        txs.append({
            "tx_id": r["tx_id"],
            "account_id": r["account_id"],
            "merchant_name": r["merchant_name"],
            "merchant_category": r["merchant_category"],
            "amount": amount,
            "tx_time": r["tx_time"].isoformat(),
            "atm_id": r["atm_id"],
            "is_cash_withdrawal": bool(r["is_cash_withdrawal"]),
            "terminal_lat": float(r["terminal_lat"]) if r["terminal_lat"] is not None else None,
            "terminal_lon": float(r["terminal_lon"]) if r["terminal_lon"] is not None else None,
        })
    return {"transactions": txs, "flags": sorted(flags)}
```

- [ ] **Step 4: Run — verify pass**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_financial.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/app/tools/financial.py backend/tests/test_tool_financial.py
git commit -m "feat(tools): scan_financials — account/ATM/citizen transaction scan with anomaly flags"
```

---

## Task 7: `lookup_vehicle_anpr`

**Files:**
- Create: `backend/app/tools/anpr.py`
- Create: `backend/tests/test_tool_anpr.py`

**Interfaces:**
- Consumes: `_common.parse_ts`, a `Session`.
- Produces: `lookup_vehicle_anpr(session, plate_number: str, start_time=None, end_time=None, *, case_id=None) -> dict | str`.
  - `{"registered": {make, model, color, owner_citizen_id} | None, "crossings": [ {seen_time, direction, border_camera_id, observed_make, observed_model} ... ], "cloned_plate_suspected": bool}`.
  - `cloned_plate_suspected` is `True` iff there is a registered vehicle AND some crossing's `observed_make`/`observed_model` differs from it. **In Plan 02's base world it is always `False`** (seeded `observed == registered`); the true case arrives with Plan 03. Document this; the test asserts `False` for base data.
  - No registered vehicle and no crossings → `"NO MATCH FOUND"`.
  - `start_time`/`end_time` optional; omitted → all crossings for the plate.

- [ ] **Step 1: Write the failing test — `backend/tests/test_tool_anpr.py`**

```python
import json

import pytest
from sqlalchemy import text

from app.tools.anpr import lookup_vehicle_anpr

pytestmark = pytest.mark.slow


def test_lookup_registered_vehicle_with_crossings(db):
    plate = db.execute(text(
        "SELECT v.plate_number FROM vehicles v "
        "JOIN anpr_events a ON a.plate_number = v.plate_number LIMIT 1")).scalar()
    res = lookup_vehicle_anpr(db, plate)
    assert res["registered"] is not None
    assert set(res["registered"]) == {"make", "model", "color", "owner_citizen_id"}
    assert res["crossings"]
    assert res["cloned_plate_suspected"] is False  # base world: observed == registered
    json.dumps(res)


def test_lookup_unknown_plate_returns_sentinel(db):
    assert lookup_vehicle_anpr(db, "ZZ99 ZZZ") == "NO MATCH FOUND"


def test_time_window_filters_crossings(db):
    plate, t0 = db.execute(text(
        "SELECT plate_number, min(seen_time) FROM anpr_events "
        "WHERE case_id IS NULL GROUP BY plate_number LIMIT 1")).first()
    res = lookup_vehicle_anpr(db, plate, start_time=t0.isoformat(), end_time=t0.isoformat())
    assert all(c["seen_time"] == t0.isoformat() for c in res["crossings"])
```

- [ ] **Step 2: Run — verify it fails**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_anpr.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.tools.anpr'`

- [ ] **Step 3: Write `app/tools/anpr.py`**

```python
"""lookup_vehicle_anpr — registered-vehicle + border-crossing lookup over
`vehicles` + `anpr_events`. case_id predicate on anpr_events. In Plan 02
`cloned_plate_suspected` is always False (base world seeds observed==registered);
the cloned-plate tactic is a Plan 03 injection."""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.tools._common import parse_ts

_VEHICLE = text(
    "SELECT plate_number, make, model, color, registered_citizen_id "
    "FROM vehicles WHERE plate_number = :p"
)

_CROSSINGS = text(
    """
    SELECT seen_time, direction, border_camera_id, observed_make, observed_model
    FROM anpr_events
    WHERE plate_number = :p
      AND (:start IS NULL OR seen_time >= :start)
      AND (:end IS NULL OR seen_time <= :end)
      AND (case_id IS NULL OR case_id = :case_id)
    ORDER BY seen_time
    """
)


def lookup_vehicle_anpr(session: Session, plate_number: str, start_time=None, end_time=None,
                        *, case_id: "str | None" = None) -> "dict | str":
    v = session.execute(_VEHICLE, {"p": plate_number}).mappings().first()
    start = parse_ts(start_time) if start_time else None
    end = parse_ts(end_time) if end_time else None
    rows = session.execute(
        _CROSSINGS, {"p": plate_number, "start": start, "end": end, "case_id": case_id}
    ).mappings().all()

    crossings = [
        {
            "seen_time": r["seen_time"].isoformat(),
            "direction": r["direction"],
            "border_camera_id": r["border_camera_id"],
            "observed_make": r["observed_make"],
            "observed_model": r["observed_model"],
        }
        for r in rows
    ]
    if v is None and not crossings:
        return "NO MATCH FOUND"

    registered = None
    cloned = False
    if v is not None:
        registered = {
            "make": v["make"],
            "model": v["model"],
            "color": v["color"],
            "owner_citizen_id": str(v["registered_citizen_id"]) if v["registered_citizen_id"] else None,
        }
        cloned = any(
            c["observed_make"] != v["make"] or c["observed_model"] != v["model"]
            for c in crossings
        )
    return {"registered": registered, "crossings": crossings, "cloned_plate_suspected": cloned}
```

- [ ] **Step 4: Run — verify pass**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_anpr.py -v`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/app/tools/anpr.py backend/tests/test_tool_anpr.py
git commit -m "feat(tools): lookup_vehicle_anpr — registered vehicle + border crossings + cloned-plate flag"
```

---

## Task 8: `pivot_digital_identity`

**Files:**
- Create: `backend/app/tools/digital.py`
- Create: `backend/tests/test_tool_digital.py`

**Interfaces:**
- Consumes: `re`, a `Session`.
- Produces: `pivot_digital_identity(session, query: str, *, case_id=None) -> dict`.
  - Query kind: contains `@` → email; matches `^\d{1,3}(\.\d{1,3}){3}$` → ip; else → handle.
  - Returns `{"profiles": [...], "posts": [...], "breach_links": [...], "resolved_citizen_id": str | None, "linked_households": [...]}`.
    - profile dict: `{username, platform, display_name, bio, recovery_email, is_private, citizen_id}`.
    - post dict: `{handle, content, posted_time, reply_to}`.
    - breach dict: `{breach_source, leaked_username, leaked_email, leaked_ip, password_hash}`.
    - household dict: `{household_id, address}`.
  - **handle**: profiles by `lower(username)`; posts by that handle; breach rows by `lower(leaked_username)`. If a breach row's `leaked_email` matches some profile's `recovery_email`, take that profile's `citizen_id` → `resolved_citizen_id`; else fall back to a directly-linked profile's `citizen_id`.
  - **email**: profiles by `lower(recovery_email)` (→ `citizen_id`); breach rows by `lower(leaked_email)`.
  - **ip**: breach rows by `leaked_ip = :q::inet`; `households` where `wan_ip = :q::inet` → `linked_households`.
  - Any list empty → `[]`; `resolved_citizen_id` `None` when nothing resolves. Success shape is always a dict.

- [ ] **Step 1: Write the failing test — `backend/tests/test_tool_digital.py`**

```python
import json

import pytest
from sqlalchemy import text

from app.tools.digital import pivot_digital_identity

pytestmark = pytest.mark.slow


def test_pivot_by_handle_returns_profile_and_posts(db):
    handle = db.execute(text("SELECT username FROM social_profiles LIMIT 1")).scalar()
    res = pivot_digital_identity(db, handle)
    assert isinstance(res, dict)
    assert any(p["username"].lower() == handle.lower() for p in res["profiles"])
    assert all(set(p) == {"username", "platform", "display_name", "bio",
                          "recovery_email", "is_private", "citizen_id"} for p in res["profiles"])
    json.dumps(res)


def test_pivot_handle_to_citizen_via_breach_email(db):
    row = db.execute(text(
        "SELECT b.leaked_username, sp.citizen_id "
        "FROM breach_dumps b JOIN social_profiles sp "
        "  ON lower(sp.recovery_email) = lower(b.leaked_email) "
        "WHERE sp.citizen_id IS NOT NULL LIMIT 1")).mappings().first()
    if row is None:
        pytest.skip("seed produced no handle->breach->email->citizen chain")
    res = pivot_digital_identity(db, row["leaked_username"])
    assert res["breach_links"]
    assert res["resolved_citizen_id"] == str(row["citizen_id"])


def test_pivot_by_email(db):
    email = db.execute(text("SELECT recovery_email FROM social_profiles LIMIT 1")).scalar()
    res = pivot_digital_identity(db, email)
    assert res["profiles"]
    assert all(p["recovery_email"].lower() == email.lower() for p in res["profiles"])


def test_pivot_by_ip_lists_households(db):
    ip = db.execute(text("SELECT host(wan_ip) FROM households LIMIT 1")).scalar()
    res = pivot_digital_identity(db, ip)
    assert any(h["household_id"] for h in res["linked_households"])


def test_pivot_unknown_handle_all_empty(db):
    res = pivot_digital_identity(db, "zzz_nobody_9999")
    assert res["profiles"] == [] and res["posts"] == [] and res["breach_links"] == []
    assert res["resolved_citizen_id"] is None
```

- [ ] **Step 2: Run — verify it fails**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_digital.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.tools.digital'`

- [ ] **Step 3: Write `app/tools/digital.py`**

```python
"""pivot_digital_identity — OSINT chaining over `social_profiles`,
`social_posts`, `breach_dumps` (+ `households` for IP). case_id predicate on
social_posts and breach_dumps. Resolves handle -> breach email -> profile
recovery_email -> citizen_id."""
import re

from sqlalchemy import text
from sqlalchemy.orm import Session

_IP_RE = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")

_PROFILE_BY_USERNAME = text(
    "SELECT username, platform, display_name, bio, recovery_email, is_private, citizen_id "
    "FROM social_profiles WHERE lower(username) = lower(:q)"
)
_PROFILE_BY_EMAIL = text(
    "SELECT username, platform, display_name, bio, recovery_email, is_private, citizen_id "
    "FROM social_profiles WHERE lower(recovery_email) = lower(:q)"
)
_POSTS_BY_HANDLE = text(
    "SELECT handle, content, posted_time, reply_to FROM social_posts "
    "WHERE lower(handle) = lower(:q) AND (case_id IS NULL OR case_id = :case_id) "
    "ORDER BY posted_time DESC LIMIT 20"
)
_BREACH_BY_USERNAME = text(
    "SELECT breach_source, leaked_username, leaked_email, host(leaked_ip) AS leaked_ip, password_hash "
    "FROM breach_dumps WHERE lower(leaked_username) = lower(:q) "
    "AND (case_id IS NULL OR case_id = :case_id)"
)
_BREACH_BY_EMAIL = text(
    "SELECT breach_source, leaked_username, leaked_email, host(leaked_ip) AS leaked_ip, password_hash "
    "FROM breach_dumps WHERE lower(leaked_email) = lower(:q) "
    "AND (case_id IS NULL OR case_id = :case_id)"
)
_BREACH_BY_IP = text(
    "SELECT breach_source, leaked_username, leaked_email, host(leaked_ip) AS leaked_ip, password_hash "
    "FROM breach_dumps WHERE leaked_ip = CAST(:q AS inet) "
    "AND (case_id IS NULL OR case_id = :case_id)"
)
_HOUSEHOLDS_BY_IP = text(
    "SELECT household_id, address FROM households WHERE wan_ip = CAST(:q AS inet)"
)


def _profile_dict(r) -> dict:
    return {
        "username": r["username"], "platform": r["platform"],
        "display_name": r["display_name"], "bio": r["bio"],
        "recovery_email": r["recovery_email"], "is_private": bool(r["is_private"]),
        "citizen_id": str(r["citizen_id"]) if r["citizen_id"] else None,
    }


def _breach_dict(r) -> dict:
    return {
        "breach_source": r["breach_source"], "leaked_username": r["leaked_username"],
        "leaked_email": r["leaked_email"], "leaked_ip": r["leaked_ip"],
        "password_hash": r["password_hash"],
    }


def pivot_digital_identity(session: Session, query: str, *, case_id: "str | None" = None) -> dict:
    q = (query or "").strip()
    params = {"q": q, "case_id": case_id}
    profiles, posts, breaches, households = [], [], [], []
    resolved = None

    if "@" in q:
        kind = "email"
    elif _IP_RE.match(q):
        kind = "ip"
    else:
        kind = "handle"

    if kind == "handle":
        profiles = [_profile_dict(r) for r in
                    session.execute(_PROFILE_BY_USERNAME, params).mappings()]
        posts = [
            {"handle": r["handle"], "content": r["content"],
             "posted_time": r["posted_time"].isoformat(), "reply_to": r["reply_to"]}
            for r in session.execute(_POSTS_BY_HANDLE, params).mappings()
        ]
        breaches = [_breach_dict(r) for r in
                    session.execute(_BREACH_BY_USERNAME, params).mappings()]
        for b in breaches:
            if b["leaked_email"]:
                hit = session.execute(_PROFILE_BY_EMAIL,
                                      {"q": b["leaked_email"]}).mappings().first()
                if hit and hit["citizen_id"]:
                    resolved = str(hit["citizen_id"])
                    break
        if resolved is None:
            for p in profiles:
                if p["citizen_id"]:
                    resolved = p["citizen_id"]
                    break

    elif kind == "email":
        profiles = [_profile_dict(r) for r in
                    session.execute(_PROFILE_BY_EMAIL, params).mappings()]
        breaches = [_breach_dict(r) for r in
                    session.execute(_BREACH_BY_EMAIL, params).mappings()]
        for p in profiles:
            if p["citizen_id"]:
                resolved = p["citizen_id"]
                break

    else:  # ip
        breaches = [_breach_dict(r) for r in
                    session.execute(_BREACH_BY_IP, params).mappings()]
        households = [
            {"household_id": str(r["household_id"]), "address": r["address"]}
            for r in session.execute(_HOUSEHOLDS_BY_IP, {"q": q}).mappings()
        ]

    return {
        "profiles": profiles,
        "posts": posts,
        "breach_links": breaches,
        "resolved_citizen_id": resolved,
        "linked_households": households,
    }
```

- [ ] **Step 4: Run — verify pass**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_digital.py -v`
Expected: PASS (5 passed; one may `skip` if the seed produced no handle→breach→email→citizen chain — acceptable, note it in the report).

- [ ] **Step 5: Commit**

```bash
git add backend/app/tools/digital.py backend/tests/test_tool_digital.py
git commit -m "feat(tools): pivot_digital_identity — handle/email/IP OSINT chaining across social + breach data"
```

---

## Task 9: `registry_schema.py` — Gemini declarations, registry, dispatcher

**Files:**
- Create: `backend/app/tools/registry_schema.py`
- Create: `backend/tests/test_tool_registry_schema.py`

**Interfaces:**
- Consumes: all 7 tool callables.
- Produces:
  - `FUNCTION_DECLARATIONS: list[dict]` — 7 entries, each `{"name", "description", "parameters": {"type": "object", "properties": {...}, "required": [...]}}`. Property names match each tool's domain args **exactly** (`query`, `search_type`, `sample_type`, `sample_data`, `target`, `mode`, `start_time`, `end_time`, `camera_id`, `filter_tags`, `plate_number`). **No declaration contains a `case_id` property.**
  - `TOOL_REGISTRY: dict[str, Callable]` — the 7 names → callables.
  - `dispatch_tool(session, name: str, args: dict, case_id: str | None = None)` — looks up `name`, calls `fn(session, **args, case_id=case_id)`; unknown name → `f"UNKNOWN TOOL: {name}"`; `TypeError` from bad args → `f"BAD ARGUMENTS for {name}: {exc}"`.

- [ ] **Step 1: Write the failing test — `backend/tests/test_tool_registry_schema.py`**

```python
import inspect

from app.tools import registry_schema as rs

_EXPECTED = {
    "search_civil_registry", "match_biometrics", "query_telecom", "search_cctv",
    "scan_financials", "lookup_vehicle_anpr", "pivot_digital_identity",
}


def test_seven_declarations_and_registry_agree():
    decl_names = {d["name"] for d in rs.FUNCTION_DECLARATIONS}
    assert decl_names == _EXPECTED == set(rs.TOOL_REGISTRY)


def test_declarations_are_well_formed_and_hide_case_id():
    for d in rs.FUNCTION_DECLARATIONS:
        assert d["description"].strip()
        p = d["parameters"]
        assert p["type"] == "object" and isinstance(p["properties"], dict)
        assert "case_id" not in p["properties"]
        for req in p.get("required", []):
            assert req in p["properties"]
        for prop in p["properties"].values():
            assert prop.get("description", "").strip()


def test_declared_params_are_real_tool_parameters():
    for d in rs.FUNCTION_DECLARATIONS:
        fn = rs.TOOL_REGISTRY[d["name"]]
        sig = set(inspect.signature(fn).parameters) - {"session", "case_id"}
        assert set(d["parameters"]["properties"]).issubset(sig), d["name"]


def test_dispatch_unknown_tool():
    assert rs.dispatch_tool(None, "nope", {}) == "UNKNOWN TOOL: nope"


def test_dispatch_bad_arguments_is_caught():
    out = rs.dispatch_tool(None, "search_civil_registry", {"wrong_kwarg": 1})
    assert isinstance(out, str) and out.startswith("BAD ARGUMENTS for search_civil_registry")
```

- [ ] **Step 2: Run — verify it fails**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_registry_schema.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.tools.registry_schema'`

- [ ] **Step 3: Write `app/tools/registry_schema.py`**

```python
"""Gemini function-calling declarations + name->callable registry + dispatcher.
case_id is NEVER declared — the agent layer binds it per dispatch."""
from app.tools.registry import search_civil_registry
from app.tools.biometric import match_biometrics
from app.tools.telecom import query_telecom
from app.tools.cctv import search_cctv
from app.tools.financial import scan_financials
from app.tools.anpr import lookup_vehicle_anpr
from app.tools.digital import pivot_digital_identity

_TS = "ISO-8601 timestamp, e.g. 2026-09-01T22:30:00Z."

FUNCTION_DECLARATIONS = [
    {
        "name": "search_civil_registry",
        "description": ("Fuzzy-search Ashwick's civil registry by a person's name or a street "
                        "address. Returns matching citizens with identity fields, whether each "
                        "holds a criminal record, and a similarity score. Use to turn a name or "
                        "address from the investigator's narrative into citizen records."),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "A person's name or a street address."},
                "search_type": {"type": "string", "enum": ["auto", "name", "address"],
                                "description": "Restrict matching to name or address, or 'auto' for both."},
            },
            "required": ["query"],
        },
    },
    {
        "name": "match_biometrics",
        "description": ("Compare a latent fingerprint hash or a DNA marker string against the "
                        "~45 records in the criminal registry. Returns the matching citizen and "
                        "confidence, or 'NO MATCH FOUND' (95%+ of the town is unregistered)."),
        "parameters": {
            "type": "object",
            "properties": {
                "sample_type": {"type": "string", "enum": ["fingerprint", "dna"],
                                "description": "Which kind of sample sample_data is."},
                "sample_data": {"type": "string",
                                "description": "The fingerprint hash (hex) or DNA marker string."},
            },
            "required": ["sample_type", "sample_data"],
        },
    },
    {
        "name": "query_telecom",
        "description": ("Query the cellular network. mode='tower_dump': every phone that pinged a "
                        "given tower in a time window (the spatial net). mode='call_log': calls and "
                        "SMS for a phone number in a window, flagging prepaid-burner counterparties. "
                        "mode='subscriber': the contract behind a number."),
        "parameters": {
            "type": "object",
            "properties": {
                "target": {"type": "string",
                           "description": "A tower_id (e.g. TOWER-1) for tower_dump, else a phone number."},
                "mode": {"type": "string", "enum": ["tower_dump", "call_log", "subscriber"],
                         "description": "Which telecom query to run."},
                "start_time": {"type": "string", "description": _TS},
                "end_time": {"type": "string", "description": _TS},
            },
            "required": ["target", "mode", "start_time", "end_time"],
        },
    },
    {
        "name": "search_cctv",
        "description": ("Pull sightings from one CCTV camera over a time window, with optional "
                        "clothing-tag filtering. Returns 'NO COVERAGE' for an unknown camera; "
                        "night sightings have degraded face_confidence."),
        "parameters": {
            "type": "object",
            "properties": {
                "camera_id": {"type": "string", "description": "Camera id, e.g. CAM-04."},
                "start_time": {"type": "string", "description": _TS},
                "end_time": {"type": "string", "description": _TS},
                "filter_tags": {"type": "array", "items": {"type": "string"},
                                "description": "Optional clothing tags to filter sightings by."},
            },
            "required": ["camera_id", "start_time", "end_time"],
        },
    },
    {
        "name": "scan_financials",
        "description": ("Scan card and ATM transactions for an account id, an ATM id, or a "
                        "citizen id, over a time window. Flags large cash withdrawals and "
                        "suspicious merchant categories (hardware, pharmacy)."),
        "parameters": {
            "type": "object",
            "properties": {
                "target": {"type": "string",
                           "description": "An account_id, an atm_id (ATM-NN), or a citizen_id (UUID)."},
                "start_time": {"type": "string", "description": _TS},
                "end_time": {"type": "string", "description": _TS},
            },
            "required": ["target", "start_time", "end_time"],
        },
    },
    {
        "name": "lookup_vehicle_anpr",
        "description": ("Look up a number plate: the registered vehicle (make/model/colour/owner) "
                        "and its border-camera crossings. Sets cloned_plate_suspected when an "
                        "observed make/model differs from the registration."),
        "parameters": {
            "type": "object",
            "properties": {
                "plate_number": {"type": "string", "description": "The number plate, e.g. 'AB12 CDE'."},
                "start_time": {"type": "string", "description": _TS + " Optional."},
                "end_time": {"type": "string", "description": _TS + " Optional."},
            },
            "required": ["plate_number"],
        },
    },
    {
        "name": "pivot_digital_identity",
        "description": ("OSINT pivot across social profiles, posts, and leaked breach dumps. Give "
                        "a handle, an email, or an IP. Chains handle -> breach email -> profile "
                        "recovery email -> citizen id where the data allows."),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string",
                          "description": "A social handle, an email address, or an IPv4 address."},
            },
            "required": ["query"],
        },
    },
]

TOOL_REGISTRY = {
    "search_civil_registry": search_civil_registry,
    "match_biometrics": match_biometrics,
    "query_telecom": query_telecom,
    "search_cctv": search_cctv,
    "scan_financials": scan_financials,
    "lookup_vehicle_anpr": lookup_vehicle_anpr,
    "pivot_digital_identity": pivot_digital_identity,
}


def dispatch_tool(session, name: str, args: dict, case_id: "str | None" = None):
    fn = TOOL_REGISTRY.get(name)
    if fn is None:
        return f"UNKNOWN TOOL: {name}"
    try:
        return fn(session, **(args or {}), case_id=case_id)
    except TypeError as exc:
        return f"BAD ARGUMENTS for {name}: {exc}"
```

- [ ] **Step 4: Run — verify pass**

Run: `cd backend && .venv/Scripts/python.exe -m pytest tests/test_tool_registry_schema.py -v`
Expected: PASS (5 passed). Non-slow — no DB.

- [ ] **Step 5: Full-suite check + commit**

Run (with `DATABASE_URL` set): `cd backend && .venv/Scripts/python.exe -m pytest -q`
Expected: all green — Plan 01's full suite (incl. the 4 previously-slow, now runnable) + Plan 02's tool tests. State the exact pass count in the report; 0 failed.
Run (no DB): `cd backend && .venv/Scripts/python.exe -m pytest -q -m "not slow"` — Plan 01 non-slow + Plan 02's `_common` (8) + `registry_schema` (5) + `match_biometrics` non-slow (1). State the split.

```bash
git add backend/app/tools/registry_schema.py backend/tests/test_tool_registry_schema.py
git commit -m "feat(tools): Gemini function declarations, TOOL_REGISTRY, dispatch_tool"
```

---

## Self-Review

**1. Spec coverage (design §5):**

| §5 tool | Task | Sentinel(s) | Case-aware tables |
|---|---|---|---|
| 5.1 `search_civil_registry` | 2 | `[]` | none (citizens) |
| 5.2 `match_biometrics` | 3 | `"NO MATCH FOUND"` | none (criminal_records) |
| 5.3 `query_telecom` | 4 | `[]`, `"NO MATCH FOUND"` | cell_pings, call_records, phones + PING_SUPPRESSION |
| 5.4 `search_cctv` | 5 | `"NO COVERAGE"`, `sightings: []` | cctv_sightings |
| 5.5 `scan_financials` | 6 | `{transactions:[],flags:[]}` | financial_transactions |
| 5.6 `lookup_vehicle_anpr` | 7 | `"NO MATCH FOUND"` | anpr_events |
| 5.7 `pivot_digital_identity` | 8 | `[]` per list, `resolved_citizen_id: None` | social_posts, breach_dumps |
| registry / dispatcher (§5 preamble, §6.3) | 9 | `UNKNOWN TOOL`, `BAD ARGUMENTS` | n/a |
| Shared helpers + fixture | 1 | n/a | n/a |

No gaps. The "witness statements need no tool" note (§5 end) is respected — no witness tool.

**2. Placeholder scan:** every code step is complete runnable code; every test step is real test functions. The only conditional is `test_pivot_handle_to_citizen_via_breach_email`, which `pytest.skip`s if the seed produced no such chain — an honest data-dependent skip, not a placeholder.

**3. Type consistency:**
- Every tool: `(session, <domain args>, *, case_id=None)`. `dispatch_tool` calls `fn(session, **args, case_id=case_id)` — matches.
- `_common.parse_ts` / `hamming_hex` signatures match every call site (telecom, cctv, financial, anpr, biometric).
- `FUNCTION_DECLARATIONS` property names ⊆ each tool's real parameter names — asserted by `test_declared_params_are_real_tool_parameters`.
- Return shapes match §5: list-shaped tools return `[]` when empty; dict-shaped return their dict; miss-sentinels only where §5 specifies a string.
- `db` fixture (Task 1) is the single DB-session fixture every slow tool test consumes; `_seeded` gates it. Consistent across Tasks 2–8.

Recorded as intentional tightenings of §5's looser prose: `search_cctv` returns a dict (`{camera_id, coverage_desc, sightings}`) not "a list + a string"; `scan_financials` unknown-target returns `{"transactions": [], "flags": []}` (its success shape is a dict, so a string sentinel would be inconsistent). Both are noted in their tasks.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-09-08-aegis-02-agent-tools.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh implementer per task, task review after each, broad review at the end.

**2. Inline Execution** — tasks executed in this session with checkpoints.

**Prerequisite:** a live `DATABASE_URL` with the Plan 01 world seeded. Tasks 1 and 9 (and one `match_biometrics` case) have non-slow tests that run without it; Tasks 2–8 are almost entirely `@pytest.mark.slow` and cannot be verified without the database. Provide the Neon URL before execution.
