# AEGIS backend

## Setup
1. `python -m venv .venv` then activate it
   (PowerShell: `.venv\Scripts\Activate.ps1`; Git Bash: `source .venv/Scripts/activate`).
2. `pip install -r requirements.txt`
3. `cp .env.example .env` and paste your Neon **pooled** `DATABASE_URL`.

## Seed the world
    python -m seed.seed_world

Deterministic (RNG seed 42). ~1,000 citizens + 7 days of telemetry, ~20-25 MB, <30 s.
Re-running drops and rebuilds every table identically.

> Note: requires a live PostgreSQL `DATABASE_URL`. The seeder and its integration tests (`-m slow`) have not yet been run against a database in this branch — run them once your Neon project exists.

## Tests
    python -m pytest -v -m "not slow"   # 24 passing, no database required
    python -m pytest -v                 # + slow integration tests (needs DATABASE_URL)

## State after Plan 01
19 tables, base world only. No cases yet — `scenarios/` stays empty until Plan 03. Seeder code complete; live run + slow tests pending a `DATABASE_URL`.
