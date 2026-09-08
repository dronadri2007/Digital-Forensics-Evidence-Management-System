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
    assert all(tuple(r.keys()) == tuple(rows[0].keys()) for r in rows), \
        f"{table}: inconsistent row keys"
    cols = list(rows[0].keys())
    stmt = sql.SQL("COPY {tbl} ({cols}) FROM STDIN").format(
        tbl=sql.Identifier(table),
        cols=sql.SQL(", ").join(sql.Identifier(c) for c in cols),
    )
    with conn.cursor() as cur:
        with cur.copy(stmt) as cp:
            for r in rows:
                cp.write_row([r[c] for c in cols])
        # psycopg 3 refreshes the cursor's result (and rowcount) from the
        # CommandComplete tag once the `copy()` context exits — this is the
        # count of rows the server actually wrote.
        written = cur.rowcount
    return written if written is not None and written >= 0 else len(rows)


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
