# Project AEGIS — Consolidated Design Document

**Automated Evidence Governance & Intelligence System**
An AI-assisted smart digital forensics & investigation sandbox.

- **Date:** 2026-09-08
- **Status:** Draft for review
- **Scope decision:** "Updated Master Plan" — 1,000 citizens, 8 data layers, 7 agent tools, 4 frozen tiered scenarios + a live dynamic case generator (Tier 5 wildcard).
- **LLM:** Google Gemini Flash (free tier, native function calling).
- **Timeline:** 10–15 day sprint.
- **Budget:** $0/month (Neon + Render + Vercel + UptimeRobot free tiers).

This document supersedes the prose spec. It pins concrete schemas, tool
signatures, the case-layering mechanism, the agent loop, and the build
order. Where the two spec drafts disagreed, this document is authoritative.

---

## 1. Core philosophy (unchanged)

AEGIS is neither a live-internet OSINT scraper (blocked by privacy law,
paywalls, and the fact that physical evidence has no web presence) nor a
flat `SELECT * FROM criminals WHERE print = X` CRUD app (zero investigative
intelligence). It is:

- **The Sandbox** — a simulated town (Ashwick) of 1,000 citizens emitting
  authentic *digital exhaust* over a 7-day timeline across 8 infrastructure
  layers, seeded deterministically by a pure-Python pipeline (no LLM tokens).
- **The Sleuth** — an agentic reasoning engine with **no god-mode knowledge**
  of the perpetrator. It parses an investigator narrative, forms competing
  hypotheses, dispatches targeted SQL probes via function calling, chains
  OSINT leads, exposes broken alibis, and assembles an interactive
  force-directed "red string" murder board.

**Hard rule enforced in the system prompt:** the model may not assert any
fact about the world unless that fact came from a tool result.

---

## 2. Repository layout

Single git repo, initialised today, monorepo with two apps.

```
aegis/
├── docs/
│   └── design/
│       └── aegis-design.md          # this file
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, lifespan, /health
│   │   ├── config.py               # pydantic-settings: DATABASE_URL, GEMINI_API_KEY, ALLOWED_ORIGINS
│   │   ├── db.py                   # SQLAlchemy engine + session
│   │   ├── models/
│   │   │   ├── base.py             # DeclarativeBase, shared mixins
│   │   │   ├── world.py            # households, citizens, criminal_records, phones, vehicles,
│   │   │   │                       #   cctv_cameras, bank_accounts, social_profiles
│   │   │   ├── telemetry.py        # cell_pings, call_records, cctv_sightings,
│   │   │   │                       #   financial_transactions, anpr_events, social_posts, breach_dumps
│   │   │   └── case.py             # cases, case_evidence, witness_reports, investigation_log
│   │   ├── tools/
│   │   │   ├── registry.py         # search_civil_registry
│   │   │   ├── biometric.py        # match_biometrics
│   │   │   ├── telecom.py          # query_telecom
│   │   │   ├── cctv.py             # search_cctv
│   │   │   ├── financial.py        # scan_financials
│   │   │   ├── anpr.py             # lookup_vehicle_anpr
│   │   │   ├── digital.py          # pivot_digital_identity
│   │   │   └── registry_schema.py  # the 7 JSON tool declarations for Gemini
│   │   ├── services/
│   │   │   ├── agent_service.py    # ReAct function-calling loop, SSE step emitter
│   │   │   ├── case_generator.py   # victim/killer pick, blueprint, evidence injection, briefing
│   │   │   └── graph_service.py    # derives nodes/edges from investigation_log + case_evidence
│   │   └── routers/
│   │       ├── cases.py            # POST /cases, GET /cases, GET /cases/{id}, POST /cases/{id}/reveal
│   │       └── investigation.py    # POST /cases/{id}/dispatch (SSE), GET /cases/{id}/graph, GET /cases/{id}/log
│   ├── seed/
│   │   ├── seed_world.py           # deterministic 1,000-citizen + 7-day telemetry seeder
│   │   └── constants.py            # tunable knobs (POP=1000, PING_INTERVAL_MIN=30, RNG_SEED=42, ...)
│   ├── scenarios/
│   │   ├── tier1_open_and_shut.json
│   │   ├── tier2_cloned_plate.json
│   │   ├── tier3_staged_alibi.json
│   │   └── tier4_cold_case.json
│   ├── scripts/
│   │   └── freeze_scenarios.py     # regenerates the 4 tier JSON files from fixed seeds
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                 # case selector, tier dropdown, "Generate Incident" button
│   │   ├── api.ts                  # fetch wrappers + EventSource helper
│   │   ├── components/
│   │   │   ├── MurderBoard.tsx     # react-force-graph-2d canvas
│   │   │   ├── ReasoningFeed.tsx   # SSE-driven step feed
│   │   │   ├── DispatchBar.tsx     # investigator theory input
│   │   │   ├── EvidenceDrawer.tsx  # known physical evidence for the case
│   │   │   └── RevealPanel.tsx     # AI ranking vs ground truth
│   │   └── types.ts
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── .env.example               # VITE_API_BASE
├── .gitignore
└── README.md
```

---

## 3. Data model

PostgreSQL 16 on Neon. SQLAlchemy 2.0 declarative models are the single
source of truth for schema; `seed_world.py` bulk-inserts via SQLAlchemy Core
/ `psycopg` `execute_values` in batches of 5,000.

Requires the `pg_trgm` extension (Neon-supported) for fuzzy name/address
search: `CREATE EXTENSION IF NOT EXISTS pg_trgm;` run once at seed start.

### 3.1 Case-layering principle

- The **base world** (all rows below with `case_id IS NULL`) is seeded once
  and never mutated by gameplay.
- Every crime-related row inserted by the case generator carries a non-null
  `case_id`.
- Tool queries return `base-world rows UNION this-case's rows`.
- **Ping suppression** (killer's real phone goes dark): the base pings are
  *not* deleted. The generator writes a `case_evidence` row of type
  `PING_SUPPRESSION` holding `{phone_number, start, end}`. `query_telecom`
  filters those pings out for the active case only.
- Reset / re-run a case: `DELETE FROM <telemetry tables> WHERE case_id = :id;
  DELETE FROM case_evidence WHERE case_id = :id; DELETE FROM witness_reports
  WHERE case_id = :id; DELETE FROM investigation_log WHERE case_id = :id;
  DELETE FROM cases WHERE case_id = :id;` — base world untouched.

The telemetry tables that get a nullable `case_id UUID REFERENCES cases`
(with an index): `cell_pings`, `call_records`, `cctv_sightings`,
`financial_transactions`, `anpr_events`, `social_posts`, `breach_dumps`,
`phones` (for burner SIMs).

### 3.2 Base world tables

```sql
CREATE TABLE households (
    household_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address          VARCHAR(256) NOT NULL,
    lat              DOUBLE PRECISION NOT NULL,     -- 2km x 2km grid, metres from SW origin
    lon              DOUBLE PRECISION NOT NULL,
    household_type   VARCHAR(16) NOT NULL,          -- SOLITARY | COUPLE | NUCLEAR | HMO
    wan_ip           INET NOT NULL,                 -- router public IP
    nearest_tower_id VARCHAR(16) NOT NULL           -- TOWER-1 .. TOWER-6
);

CREATE TABLE citizens (                              -- LAYER 1: Civil Registry
    citizen_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    national_id          VARCHAR(32) UNIQUE,         -- NULL for 8% "ghosts"
    full_name            VARCHAR(128) NOT NULL,
    aliases              VARCHAR(64)[] NOT NULL DEFAULT '{}',
    dob                  DATE NOT NULL,
    gender               VARCHAR(16) NOT NULL,
    address              VARCHAR(256) NOT NULL,      -- 25% deliberately stale vs household.address
    address_updated_year INT NOT NULL,
    legal_status         VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | DECEASED
    household_id         UUID NOT NULL REFERENCES households(household_id),
    occupation           VARCHAR(64) NOT NULL,
    workplace_name       VARCHAR(96),               -- NULL if unemployed/retired
    shift_pattern        VARCHAR(16) NOT NULL,      -- DAY | SWING | GRAVEYARD | NONE
    is_unemployed        BOOLEAN NOT NULL DEFAULT FALSE,
    phone_number         VARCHAR(32),               -- NULL for a few; FK-ish to phones.phone_number
    registered_plate     VARCHAR(16),              -- NULL if no vehicle
    photo_url            VARCHAR(256)               -- deterministic placeholder avatar URL
);
CREATE INDEX idx_citizens_name_trgm ON citizens USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_citizens_addr_trgm ON citizens USING gin (address gin_trgm_ops);
CREATE INDEX idx_citizens_household ON citizens (household_id);

CREATE TABLE criminal_records (                      -- LAYER 2: Criminal Biometrics (~45 rows only)
    criminal_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id       UUID NOT NULL REFERENCES citizens(citizen_id),
    priors_summary   TEXT NOT NULL,
    fingerprint_hash VARCHAR(64) NOT NULL,           -- opaque hex; matched exact / near-Hamming
    dna_string       VARCHAR(120) NOT NULL           -- opaque marker string; matched by similarity
);

CREATE TABLE phones (
    phone_number     VARCHAR(32) PRIMARY KEY,
    imei             VARCHAR(20) NOT NULL,
    citizen_id       UUID REFERENCES citizens(citizen_id),   -- NULL for burner SIMs
    subscriber_name  VARCHAR(128) NOT NULL,          -- fake / mismatched for prepaid
    is_prepaid       BOOLEAN NOT NULL DEFAULT FALSE,
    case_id          UUID REFERENCES cases(case_id)  -- NULL = base world; set for generated burners
);

CREATE TABLE vehicles (
    plate_number         VARCHAR(16) PRIMARY KEY,
    make                 VARCHAR(32) NOT NULL,
    model                VARCHAR(32) NOT NULL,
    color                VARCHAR(24) NOT NULL,
    registered_citizen_id UUID REFERENCES citizens(citizen_id)
);

CREATE TABLE cctv_cameras (
    camera_id     VARCHAR(16) PRIMARY KEY,           -- CAM-01 .. CAM-30
    lat           DOUBLE PRECISION NOT NULL,
    lon           DOUBLE PRECISION NOT NULL,
    coverage_desc VARCHAR(96) NOT NULL               -- e.g. "High St junction"
);
-- Blind spots are implicit: any location > ~120m from every camera has no coverage.

CREATE TABLE bank_accounts (
    account_id  VARCHAR(24) PRIMARY KEY,
    citizen_id  UUID NOT NULL REFERENCES citizens(citizen_id)
);

CREATE TABLE social_profiles (                       -- LAYER 7a: Digital identity
    username       VARCHAR(48) PRIMARY KEY,
    platform       VARCHAR(16) NOT NULL,             -- ASHGRAM | CHIRPER
    display_name   VARCHAR(96) NOT NULL,
    bio            VARCHAR(280) NOT NULL DEFAULT '',
    recovery_email VARCHAR(128) NOT NULL,
    citizen_id     UUID REFERENCES citizens(citizen_id),  -- the link the AI must DISCOVER, not read directly
    is_private     BOOLEAN NOT NULL DEFAULT FALSE
);
```

### 3.3 Telemetry tables (7-day time series, all with nullable `case_id`)

```sql
CREATE TABLE cell_pings (                            -- LAYER 3a: Telecom presence
    ping_id             BIGSERIAL PRIMARY KEY,
    phone_number        VARCHAR(32) NOT NULL,
    tower_id            VARCHAR(16) NOT NULL,         -- TOWER-1 .. TOWER-6
    ping_time           TIMESTAMPTZ NOT NULL,
    signal_strength_dbm INT NOT NULL,
    case_id             UUID REFERENCES cases(case_id)
);
CREATE INDEX idx_pings_tower_time  ON cell_pings (tower_id, ping_time);
CREATE INDEX idx_pings_phone_time  ON cell_pings (phone_number, ping_time);
CREATE INDEX idx_pings_case        ON cell_pings (case_id);

CREATE TABLE call_records (                          -- LAYER 3b: Telecom CDR + SMS
    cdr_id       BIGSERIAL PRIMARY KEY,
    caller_num   VARCHAR(32) NOT NULL,
    receiver_num VARCHAR(32) NOT NULL,
    start_time   TIMESTAMPTZ NOT NULL,
    duration_sec INT NOT NULL DEFAULT 0,             -- 0 for SMS
    is_sms       BOOLEAN NOT NULL DEFAULT FALSE,
    tower_id     VARCHAR(16),
    case_id      UUID REFERENCES cases(case_id)
);
CREATE INDEX idx_cdr_caller ON call_records (caller_num, start_time);
CREATE INDEX idx_cdr_recv   ON call_records (receiver_num, start_time);

CREATE TABLE cctv_sightings (                        -- LAYER 4: CCTV
    sighting_id     BIGSERIAL PRIMARY KEY,
    camera_id       VARCHAR(16) NOT NULL REFERENCES cctv_cameras(camera_id),
    seen_time       TIMESTAMPTZ NOT NULL,
    citizen_id      UUID REFERENCES citizens(citizen_id),  -- NULL when unidentified / blurry
    detected_height_cm INT NOT NULL,
    clothing_tags   VARCHAR(32)[] NOT NULL DEFAULT '{}',
    face_confidence NUMERIC(3,2) NOT NULL,           -- 0.00-1.00; halved for night sightings
    case_id         UUID REFERENCES cases(case_id)
);
CREATE INDEX idx_sightings_cam_time ON cctv_sightings (camera_id, seen_time);

CREATE TABLE financial_transactions (               -- LAYER 5: Financials
    tx_id              BIGSERIAL PRIMARY KEY,
    account_id         VARCHAR(24) NOT NULL,
    merchant_name      VARCHAR(96) NOT NULL,         -- or "ATM <atm_id>" for withdrawals
    merchant_category  VARCHAR(32) NOT NULL,         -- GROCERY | FUEL | HARDWARE | PHARMACY | CASH | ...
    amount             NUMERIC(10,2) NOT NULL,
    tx_time            TIMESTAMPTZ NOT NULL,
    atm_id             VARCHAR(16),                  -- non-null only for withdrawals
    is_cash_withdrawal BOOLEAN NOT NULL DEFAULT FALSE,
    terminal_lat       DOUBLE PRECISION,
    terminal_lon       DOUBLE PRECISION,
    case_id            UUID REFERENCES cases(case_id)
);
CREATE INDEX idx_tx_account_time ON financial_transactions (account_id, tx_time);

CREATE TABLE anpr_events (                           -- LAYER 6: Vehicle / ANPR
    anpr_id          BIGSERIAL PRIMARY KEY,
    border_camera_id VARCHAR(16) NOT NULL,           -- ANPR-N | ANPR-E | ANPR-S | ANPR-W
    plate_number     VARCHAR(16) NOT NULL,
    seen_time        TIMESTAMPTZ NOT NULL,
    direction        VARCHAR(12) NOT NULL,           -- INBOUND | OUTBOUND
    observed_make    VARCHAR(32) NOT NULL,           -- compared to vehicles.make -> cloned-plate flag
    observed_model   VARCHAR(32) NOT NULL,
    case_id          UUID REFERENCES cases(case_id)
);
CREATE INDEX idx_anpr_plate_time ON anpr_events (plate_number, seen_time);

CREATE TABLE social_posts (                          -- LAYER 7c
    post_id       BIGSERIAL PRIMARY KEY,
    handle        VARCHAR(48) NOT NULL,
    content       TEXT NOT NULL,
    posted_time   TIMESTAMPTZ NOT NULL,
    reply_to      VARCHAR(48),
    case_id       UUID REFERENCES cases(case_id)
);
CREATE INDEX idx_posts_handle_time ON social_posts (handle, posted_time);

CREATE TABLE breach_dumps (                          -- LAYER 7b: leaked breach records
    breach_id       BIGSERIAL PRIMARY KEY,
    breach_source   VARCHAR(64) NOT NULL,            -- e.g. "AshwickGym-2023"
    leaked_username VARCHAR(64) NOT NULL,
    leaked_email    VARCHAR(128) NOT NULL,
    leaked_ip       INET,
    password_hash   VARCHAR(64) NOT NULL,
    case_id         UUID REFERENCES cases(case_id)
);
CREATE INDEX idx_breach_username ON breach_dumps (leaked_username);
CREATE INDEX idx_breach_email    ON breach_dumps (leaked_email);
```

### 3.4 Case tables

```sql
CREATE TABLE cases (
    case_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(128) NOT NULL,
    tier             INT,                             -- 1..4 for frozen scenarios; NULL for wildcard
    mode             VARCHAR(12) NOT NULL,            -- FROZEN | WILDCARD
    status           VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | SOLVED | ARCHIVED
    victim_citizen_id UUID NOT NULL REFERENCES citizens(citizen_id),
    crime_time       TIMESTAMPTZ NOT NULL,
    scene_address    VARCHAR(256) NOT NULL,
    scene_lat        DOUBLE PRECISION NOT NULL,
    scene_lon        DOUBLE PRECISION NOT NULL,
    briefing_text    TEXT NOT NULL,                   -- 999 transcript + first-responder report
    solution_json    JSONB NOT NULL,                  -- GROUND TRUTH. never sent to the agent.
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- solution_json shape:
-- { "killer_citizen_id": "...", "motive": "financial", "tactics": ["dark_phone_window","cloned_plate"],
--   "evidentiary_chain": ["ATM withdrawal 22:20", "ping gap 22:30-23:15", "ANPR make mismatch", ...],
--   "expected_top_suspects": ["<killer_id>", "<decoy_id>"] }

CREATE TABLE case_evidence (
    evidence_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id       UUID NOT NULL REFERENCES cases(case_id),
    evidence_type VARCHAR(32) NOT NULL,   -- LATENT_PRINT | DNA_SAMPLE | PING_SUPPRESSION |
                                          -- PLANTED_CCTV | FORCED_ENTRY | DISCARDED_ITEM
    payload_json  JSONB NOT NULL,         -- type-specific; e.g. PING_SUPPRESSION -> {phone_number,start,end}
    is_discovered BOOLEAN NOT NULL DEFAULT FALSE   -- flips true once a tool surfaces it; feeds the board
);
CREATE INDEX idx_evidence_case ON case_evidence (case_id);

CREATE TABLE witness_reports (                       -- LAYER 8: Witness statements
    report_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id            UUID NOT NULL REFERENCES cases(case_id),
    witness_name       VARCHAR(96) NOT NULL,
    statement_text     TEXT NOT NULL,
    observed_time      TIMESTAMPTZ NOT NULL,
    reliability_penalty NUMERIC(3,2) NOT NULL          -- 0.35-0.50; at least one deliberate error per case
);

CREATE TABLE investigation_log (                      -- replay + reasoning feed + audit
    log_id      BIGSERIAL PRIMARY KEY,
    case_id     UUID NOT NULL REFERENCES cases(case_id),
    step_no     INT NOT NULL,
    role        VARCHAR(16) NOT NULL,   -- INVESTIGATOR | AGENT | TOOL
    content     TEXT,                   -- narrative text or agent briefing chunk
    tool_name   VARCHAR(48),
    tool_args   JSONB,
    tool_result JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_log_case_step ON investigation_log (case_id, step_no);
```

---

## 4. World seeding — `seed_world.py`

Deterministic, pure-Python, zero LLM tokens. `numpy` + `Faker` seeded with
`RNG_SEED = 42`. Idempotent: drops and recreates all tables, then reloads
the 4 frozen scenarios.

### 4.1 Population math (1,000 citizens)

| Segment | Ratio | Count | Households |
|---|---|---|---|
| Solitary / singles | 35% | 350 | 350 |
| Childless couples | 25% | 250 | 125 |
| Nuclear families | 30% | 300 | ~75 (avg 4) |
| Shared HMO flats | 10% | 100 | ~15 (avg ~6–7) |
| **Total** | 100% | **1,000** | **~565** |

> Reconciliation note: the prose spec said "~250 households". That is
> inconsistent with 35% solitary dwellers. This design honours the
> demographic ratios; household count falls out at ~565. `constants.py`
> exposes the ratios so this is tunable.

| Employment | Ratio | Count |
|---|---|---|
| Day 9–5 | 45% | 450 |
| Swing 14:00–22:00 | 18% | 180 |
| Graveyard 22:00–06:00 | 11% | 110 |
| Unemployed / odd-job | 12% | 120 |
| Retired / elderly | 14% | 140 |

Friction knobs:
- **Ghosts:** 80 citizens (8%) get `national_id = NULL`.
- **Criminal records:** 45 citizens (4.5%) get a `criminal_records` row.
- **Stale addresses:** 250 citizens (25%) get `citizens.address` !=
  their household address, with an old `address_updated_year`.
- **CCTV:** 30 cameras clustered on commercial hubs; ~35% of the grid is
  > 120 m from any camera (blind).
- **Towers:** 6, one per grid sector.
- **VPN/idle:** router behaviour is modelled only implicitly via
  `case_evidence` for generated cases (the base world has no router-log
  table in the 8-layer scope; alibi checks in the cold-case tier use
  `cell_pings` density + co-occupancy instead — see §6).

### 4.2 Seven-day telemetry generation

For each of 7 days, per citizen, generate a routine from their shift
pattern + household type, then emit telemetry:

| Table | Model | Est. rows |
|---|---|---|
| `cell_pings` | heartbeat every `PING_INTERVAL_MIN` (30) while phone ON; most phones OFF 00:00–06:00; ~10% randomly off in blocks | ~180k–220k |
| `call_records` | ~3 calls + ~4 SMS per citizen per day, weighted to social graph | ~45k–50k |
| `cctv_sightings` | citizen passes a camera → sighting; ~35–60 sightings/camera/day; night halves `face_confidence` | ~9k |
| `financial_transactions` | ~1.8 tx/day per citizen with an account (~800 accounts) | ~10k |
| `anpr_events` | ~400 vehicles, ~0.3 border crossings/day | ~850 |
| `social_posts` | ~300 active profiles, ~1 post/day | ~2k |
| `breach_dumps` | static: ~600 leaked records (one old "AshwickGym-2023" style breach) | ~600 |

**Total ≈ 260k–290k rows, ≈ 20–25 MB.** Bulk insert in 5,000-row batches;
expected seed time 10–25 s on Neon.

### 4.3 Baseline stability (needed for the cold-case tier)

Each citizen's routine is generated once and repeated across the 7 days
with small Gaussian jitter, so a per-citizen 7-day mean/σ is meaningful.
The case generator's cold-case injection then produces a *genuine*
deviation (large Z-score) for the killer against their own baseline.

---

## 5. The 7 agent tools

Each tool is one Python function over 1–3 tables, plus a JSON declaration
in `tools/registry_schema.py`. All tools are **case-aware**: they take an
implicit `case_id` (bound by `agent_service` per dispatch, not exposed to
the model) and return `base rows + this case's rows`, minus rows hidden by
`PING_SUPPRESSION`. Every call is written to `investigation_log`.

Return values are plain JSON-serialisable dicts. On no result, tools
return an explicit sentinel (`"NO MATCH FOUND"`, `"NO COVERAGE"`, `[]`) —
never an empty/ambiguous response — so the model cannot hallucinate a fill.

### 5.1 `search_civil_registry(query, search_type="auto")`
- **Tables:** `citizens` (+ `criminal_records` existence flag).
- Fuzzy match on `full_name`, `aliases`, `address` via `pg_trgm`
  similarity (threshold 0.3), `search_type ∈ {auto,name,address}`.
- **Returns:** list of `{citizen_id, full_name, aliases, dob, gender,
  address, address_updated_year, legal_status, national_id_present,
  has_criminal_record, phone_number, registered_plate}` (cap 25, ordered
  by similarity).

### 5.2 `match_biometrics(sample_type, sample_data)`
- **Tables:** `criminal_records` (~45 rows).
- `sample_type ∈ {fingerprint, dna}`. Fingerprint: exact hash or Hamming
  distance ≤ 6 on the hex → treat as match. DNA: `rapidfuzz` ratio ≥ 0.90.
- **Returns:** `{match: true, citizen_id, confidence, priors_summary}` for
  the best hit above threshold, else `"NO MATCH FOUND"`.

### 5.3 `query_telecom(target, mode, start_time, end_time)`
- **Tables:** `cell_pings`, `call_records`, `phones`.
- `mode = "tower_dump"` → `target` is a `tower_id`; returns distinct
  `{phone_number, first_seen, last_seen, ping_count, min/max signal}` in
  the window (this is the Round-1 spatial net).
- `mode = "call_log"` → `target` is a phone number; returns calls/SMS in
  the window with the other party and whether the other party is a
  prepaid burner.
- `mode = "subscriber"` → `target` is a phone number; returns
  `{subscriber_name, is_prepaid, linked_citizen_id?}`.
- Applies active-case `PING_SUPPRESSION` markers.

### 5.4 `search_cctv(camera_id, start_time, end_time, filter_tags=[])`
- **Tables:** `cctv_cameras`, `cctv_sightings`.
- Unknown/blind camera → `"NO COVERAGE"`. Otherwise sightings in window,
  optional `clothing_tags` overlap filter.
- **Returns:** list of `{seen_time, detected_height_cm, clothing_tags,
  face_confidence, citizen_id?}` + a `coverage_desc` string.

### 5.5 `scan_financials(target, start_time, end_time)`
- **Tables:** `financial_transactions` (+ `bank_accounts` to resolve a
  `citizen_id` to their `account_id`).
- `target` = `account_id` | `atm_id` | `citizen_id`.
- Flags: `large_cash_withdrawal` (`is_cash_withdrawal` and `amount ≥ 150`),
  `suspicious_category` (`merchant_category ∈ {HARDWARE, PHARMACY}`).
- **Returns:** `{transactions: [...], flags: [...]}`.

### 5.6 `lookup_vehicle_anpr(plate_number, start_time=None, end_time=None)`
- **Tables:** `vehicles`, `anpr_events`.
- **Returns:** `{registered: {make, model, color, owner_citizen_id},
  crossings: [{seen_time, direction, border_camera_id, observed_make,
  observed_model}], cloned_plate_suspected: bool}` — the flag is true when
  any crossing's `observed_make/model` differs from the registered vehicle.

### 5.7 `pivot_digital_identity(query)`
- **Tables:** `social_profiles`, `social_posts`, `breach_dumps`.
- `query` = handle | email | IP. The OSINT-chaining tool:
  - handle → profile + recent posts + breach rows where
    `leaked_username = handle` → exposes `leaked_email` / `leaked_ip`.
  - email → profiles with that `recovery_email` + breach rows with that
    `leaked_email` → can resolve to a `citizen_id`.
  - IP → breach rows + households sharing that `wan_ip`.
- **Returns:** `{profiles: [...], posts: [...], breach_links: [...],
  resolved_citizen_id?: "..."}`.

Witness statements need no tool — they are included verbatim in the case
briefing that seeds the conversation.

---

## 6. The AI detective engine — `agent_service.py`

### 6.1 Provider

`google-genai` SDK, model `gemini-2.0-flash` (config constant
`GEMINI_MODEL`). Automatic function calling **disabled** — we run the loop
manually to stream and log every step.

### 6.2 System prompt (essence)

> You are AEGIS, an autonomous forensic detective working a live case in
> the town of Ashwick. You have **no prior knowledge** of the
> perpetrator. You may **not** state any fact about Ashwick, its
> citizens, devices, or events unless it was returned by a tool in this
> session. Method, each turn: (1) restate what is established; (2) hold at
> least two competing hypotheses; (3) choose the single most decisive
> tool call to test one of them; (4) after each result, record
> contradictions (stated alibi vs telemetry) explicitly; (5) maintain a
> ranked suspect list with honest confidence percentages that sum to a
> plausible total, never 100% unless biometrically confirmed. When you
> have enough, deliver a briefing: ranked suspects, the evidentiary chain
> per suspect, contradictions, and the next investigative move you
> recommend.

### 6.3 The ReAct loop

```
dispatch(case_id, investigator_text):
    history = load_history(case_id)            # prior turns from investigation_log
    if first turn: history.prepend(case.briefing_text + witness_reports)
    history.append(user = investigator_text)
    for step in range(MAX_STEPS = 15):
        resp = gemini.generate_content(history, tools=SEVEN_DECLS)
        if resp has function_call(s):
            for call in resp.function_calls:
                result = dispatch_tool(call.name, call.args, case_id)   # case_id injected here
                log(case_id, TOOL, tool_name=call.name, tool_args=call.args, tool_result=result)
                emit_sse({type:"tool", name:call.name, args:call.args, result:result})
                history.append(function_response = result)
            continue
        # plain text -> a briefing / question for the investigator
        log(case_id, AGENT, content=resp.text)
        emit_sse({type:"briefing", text:resp.text})
        break
    emit_sse({type:"done"})
```

- `MAX_STEPS` bounds cost and protects a live demo against loops.
- The wildcard tier caps at `MAX_STEPS = 10`.
- Streaming: FastAPI `StreamingResponse` with `media_type="text/event-stream"`.

### 6.4 The 4-round "squeeze" (cold case, Tier 4)

Not special-cased code — it is the *strategy the prompt encourages* and
the tools already support:

1. **Spatial net** — `query_telecom(tower_dump)` on the scene's tower for
   the window + `search_civil_registry` by scene-area address → opportunity pool.
2. **Alibi filter** — for multi-person households, dense concurrent
   `cell_pings` from other household members ⇒ co-occupancy alibi;
   `search_civil_registry` + workplace + graveyard shift ⇒ badge alibi.
3. **Baseline anomaly** — `query_telecom(call_log)` / `scan_financials`
   over the 7 days vs the crime night; the agent computes the deviation
   from tool data (large ATM withdrawal, ping gap, late motel-style
   spend).
4. **Relational crawl** — `pivot_digital_identity` + `query_telecom` +
   `scan_financials` for links between the shortlist and the victim.

Output: a ranked shortlist with modest, non-100% confidences.

---

## 7. The case generator — `case_generator.py`

### 7.1 Signature

```python
generate_case(mode: "frozen"|"wildcard", tier: int|None, rng_seed: int|None) -> CaseBundle
```

`CaseBundle` = the `cases` row + `case_evidence` rows + `witness_reports`
+ all case-tagged telemetry rows, ready for one transaction.

### 7.2 Pipeline

1. **Pick victim** — wildcard: from a vetted pool of ~20 citizen IDs
   (`constants.WILDCARD_POOL`, chosen during Day 11–13 testing); frozen:
   fixed IDs per tier.
2. **Pick killer** — by a relationship pulled from the base world:
   coworker (`workplace_name` match), neighbour (nearby `household`),
   social tie (`social_profiles` / `call_records`), or debtor (synthetic
   `priors`/dispute note). Tier controls whether the killer is one of the
   45 with a `criminal_records` row (Tier 1 yes → biometric hit; Tiers
   3–4 no → `"NO MATCH FOUND"`).
3. **Choose blueprint** — `crime_time`, scene = victim's address, motive
   ∈ {financial, jealousy, burglary}, `tactics ⊆ {burner_phone,
   staged_alibi, dark_phone_window, cloned_plate, discarded_weapon}`.
4. **Inject case-tagged evidence:**
   - `cctv_sightings`: one blurry sighting on the nearest non-blind camera
     ~8–15 min post-crime — low `face_confidence`, partial `clothing_tags`,
     `citizen_id = NULL`.
   - `dark_phone_window` → `case_evidence(PING_SUPPRESSION,
     {phone_number, crime_time-30m, crime_time+45m})` + one "reconnected"
     ping just after.
   - `burner_phone` → case-tagged `phones` row (mismatched
     `subscriber_name`, `is_prepaid=true`) + case-tagged `call_records`
     between killer and burner in the hour before.
   - `cloned_plate` → case-tagged `anpr_events` with the killer's
     `plate_number` but a different `observed_make/model`.
   - Digital trail → case-tagged `social_posts` (threats at the victim
     from an anonymous handle) + case-tagged `breach_dumps` row linking
     that handle's `leaked_email` to the killer's `recovery_email`/address IP.
   - `financial_transactions`: case-tagged ATM withdrawal by the killer
     ~30–50 min before the crime (`amount` £150–£300).
   - `case_evidence(LATENT_PRINT | DNA_SAMPLE, ...)`: present for
     Tiers 1–2, absent for Tiers 3–4.
   - `case_evidence(FORCED_ENTRY)` for burglary motive.
   - `witness_reports`: 1–2, each with `reliability_penalty` and **one
     deliberate error** (wrong jacket colour, time off by ~20 min).
5. **Briefing text** — templated slot-filling (deterministic, no LLM): a
   999 call transcript + a first-responder scene report + the witness
   statements appended. Wildcard *may* make one Gemini call to prettify
   prose; content still comes from the template.
6. **`solution_json`** — killer id, motive, tactics, and the exact
   evidentiary chain. Stored on the `cases` row, used only by
   `POST /cases/{id}/reveal`; **never** placed in agent context.

### 7.3 Freezing

`scripts/freeze_scenarios.py` runs `generate_case("frozen", tier=n,
rng_seed=FIXED[n])` for n∈1..4 and writes `scenarios/tierN_*.json`.
`seed_world.py` loads those JSON files at the end of seeding so the four
demo cases exist immediately and identically on every environment.
Wildcard runs live via `POST /cases {mode:"wildcard"}`.

---

## 8. Graph service — `graph_service.py`

The backend owns the murder board; the LLM only narrates.

`build_graph(case_id) -> {nodes, edges}` derives the graph
deterministically from `investigation_log` (tool calls + results) and
`case_evidence(is_discovered=true)`:

- **Nodes:** `{id, type, label, photo_url?, suspicion, meta}` where
  `type ∈ {victim, person, device, location, handle, camera, vehicle}`
  and `suspicion ∈ {poi(grey), suspect(orange), prime(red)}`. Suspicion
  is set from the agent's most recent ranked list. The system prompt
  requires every briefing to **end with a fenced ```json block**:
  `{"ranking":[{"citizen_id":"...","confidence":0.44,"tier":"prime|suspect|poi"}]}`.
  `graph_service` parses that block (prose above it feeds the reasoning
  feed); if the block is missing, ranking carries over from the previous
  turn.
- **Edges:** `{source, target, kind, label}` where
  `kind ∈ {forensic(blue solid), circumstantial(yellow dotted),
  contradiction(red glow)}`. Mapping examples:
  - `match_biometrics` hit → `forensic` edge person→evidence.
  - `pivot_digital_identity` resolving handle→citizen → `forensic`
    edge handle→person.
  - shared pub / mutual contact from `call_records` → `circumstantial`.
  - stated alibi (from briefing/among investigator text) vs
    `query_telecom` ping in the scene sector → `contradiction`.

`GET /cases/{id}/graph` returns the current snapshot; the frontend
re-fetches after each dispatch completes (`type:"done"` SSE event).

---

## 9. API surface

| Method & path | Purpose | Body / params | Response |
|---|---|---|---|
| `GET /health` | UptimeRobot keep-alive | — | `{"status":"ok"}` |
| `POST /cases` | start a case | `{mode:"tier",tier:1..4}` or `{mode:"wildcard"}` | `{case_id, title, briefing_text, evidence_summary}` |
| `GET /cases` | list | — | `[{case_id,title,tier,status}]` |
| `GET /cases/{id}` | detail | — | case + witness list + known evidence |
| `POST /cases/{id}/dispatch` | investigator turn | `{text}` | **SSE stream**: `tool` / `briefing` / `done` events |
| `GET /cases/{id}/graph` | board snapshot | — | `{nodes, edges}` |
| `GET /cases/{id}/log` | full replay | — | ordered `investigation_log` rows |
| `POST /cases/{id}/reveal` | score vs truth | — | `{solution_json, ai_last_ranking, hit: bool}` |

CORS: `CORSMiddleware`, origins from `ALLOWED_ORIGINS` env (the Vercel
domain + `http://localhost:5173`).

---

## 10. Frontend

Vite + React 18 + TypeScript + Tailwind. Dark tactical theme.

| Component | Role |
|---|---|
| `App` | case-tier `<select>` + "🎲 Generate Incident" button; on choose → `POST /cases` → load board; case header bar |
| `MurderBoard` | `react-force-graph-2d`; node colour by `suspicion`; link colour/style by `kind` (blue solid / yellow dashed / red glow); new nodes fade + spring in on re-fetch |
| `ReasoningFeed` | right panel; opens `EventSource` on dispatch; renders timestamped `tool` and `briefing` events; contradiction lines flagged red |
| `DispatchBar` | textarea; `POST /cases/{id}/dispatch`; disabled while a stream is open |
| `EvidenceDrawer` | shows the case's known physical evidence (latent print id, DNA string, witness statements) the investigator can quote into a dispatch |
| `RevealPanel` | "Solve" → `POST /reveal`; shows AI's final ranking vs ground truth + confidence, and whether the top suspect matched |

No auth, no routing beyond a single screen. `VITE_API_BASE` points at the
Render backend.

---

## 11. Deployment (all free tiers)

| Piece | Host | Config |
|---|---|---|
| DB | **Neon** | project `aegis`, PG16; `pg_trgm` extension; pooled `DATABASE_URL` |
| Backend | **Render** Web Service | root `backend/`; build `pip install -r requirements.txt`; start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`; env `DATABASE_URL`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS` |
| Seed | one-off | `python -m seed.seed_world` from local against Neon, or a Render one-off job |
| Frontend | **Vercel** | root `frontend/`; build `npm run build`; output `dist`; env `VITE_API_BASE` |
| Keep-alive | **UptimeRobot** | HTTP monitor on `…onrender.com/health`, 5-min interval |

`.env.example` committed for both apps; real `.env` git-ignored. `GEMINI_API_KEY`
from Google AI Studio (free).

---

## 12. Build order (10–15 day sprint)

| Days | Deliverable | Definition of done |
|---|---|---|
| **1** | Repo init, `git init`, monorepo skeleton, `config.py`, `db.py`, this doc committed | `uvicorn` boots, `/health` returns ok |
| **1–2** | `models/` — all base + telemetry + case tables | `create_all` builds the schema on Neon; `pg_trgm` enabled |
| **2–4** | `seed_world.py` — 1,000 citizens + 7-day telemetry | one command seeds ~25 MB in < 30 s, deterministic (same RNG → same rows) |
| **3–4** | 7 tools + `registry_schema.py` + unit tests | each tool tested against the seeded world; sentinels verified |
| **4–5** | `case_generator.py` + `freeze_scenarios.py` + 4 tier JSONs | 4 cases load at seed time; re-run leaves base world byte-identical |
| **5–7** | `agent_service.py` ReAct loop + SSE + `investigation_log` | Tier 1 solves end-to-end from a text dispatch; every step logged |
| **6–7** | `graph_service.py` + `/graph` + `/reveal` | graph JSON matches the log; reveal scores Tier 1 correctly |
| **8–10** | Frontend: board, feed, dispatch bar, drawer, reveal, tier selector, generate button | full loop works locally against local backend |
| **11–13** | Stress test all 5 tiers; pick `WILDCARD_POOL` (~20 vetted citizens); fix ranking/edge-case bugs | each tier runs clean 3× in a row; wildcard runs on any pool member |
| **14–15** | Deploy (Neon seeded, Render, Vercel, UptimeRobot); rehearse pitch | live URL solves Tier 1, cracks Tier 3 alibi, degrades Tier 4 gracefully, wildcard on demand |

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Gemini free-tier RPM/RPD limits during a live demo | cache/record frozen-tier runs; wildcard capped at 10 tool calls; keep a screen recording as fallback |
| Render free-tier cold start (~50 s) | UptimeRobot 5-min pings; pre-warm 10 min before the demo |
| Neon autosuspend adds first-query latency | pre-warm with a `SELECT 1`; dataset is tiny so warm queries are fast |
| Cold-case ranking non-determinism (LLM) | frozen Tier 4 uses a fixed seed and a rehearsed dispatch script; accept "ranked shortlist", not "exact killer" |
| Fuzzy search weak without `pg_trgm` | seed script hard-fails if the extension can't be created |
| Model asserts un-sourced facts | system prompt rule + tools return explicit sentinels + `investigation_log` review during stress testing |
| "Biometrics" realism questioned | README states clearly: opaque hashes/strings, illustrative not real forensics |

---

## 14. Out of scope (YAGNI for v1)

- The full 20-layer / 10,000-citizen blueprint.
- The Real-World Case Transpiler (external true-crime import) — the
  wildcard generator already proves "not hardcoded".
- Real biometric / CV algorithms; any live-internet access.
- Auth, multi-user, RBAC, the SHA-256 hash-chain audit service.
- 3D town view; voice ("speak your theory") input.
- ISP/router-log layer as a standalone table (alibi logic uses ping
  density + co-occupancy instead).

---

## 15. Prerequisites before coding

1. **Neon** `DATABASE_URL` (pooled) — user creating now.
2. **Gemini API key** from Google AI Studio (free) — needed by Day 5, not Day 1.
3. Local: Python 3.11, Node 24 — confirmed present.
