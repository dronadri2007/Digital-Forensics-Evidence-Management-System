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
