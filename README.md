# Project AEGIS

AI-assisted digital forensics investigation sandbox. Design: `docs/design/aegis-design.md`.

- `backend/` — FastAPI + SQLAlchemy + the deterministic world seeder
- `frontend/` — React murder board (Plan 05, not started)
- `docs/design/` — consolidated design document
- `docs/plans/` — per-subsystem implementation plans

## Status
- [x] Plan 01 — database schema + world seeder  _(code complete & unit-tested; live seed + integration tests pending a DATABASE_URL)_
- [ ] Plan 02 — the 7 agent tools
- [ ] Plan 03 — case generator + frozen scenarios
- [ ] Plan 04 — agent engine + API
- [ ] Plan 05 — frontend
