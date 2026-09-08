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


_TITLE_TOKENS = {"Mr", "Mrs", "Ms", "Miss", "Dr", "Prof", "Mx", "Sir", "Dame"}


def test_full_names_carry_no_faker_titles():
    rng, fk = _rng_faker()
    cz = population.build_citizens(rng, fk, population.build_households(rng, fk))
    for c in cz:
        head = c["full_name"].split()[0].rstrip(".")
        assert head not in _TITLE_TOKENS, f"title leaked into name: {c['full_name']!r}"


def test_phone_numbers_are_collision_free():
    rng, fk = _rng_faker()
    cz = population.build_citizens(rng, fk, population.build_households(rng, fk))
    nums = [c["phone_number"] for c in cz if c["phone_number"] is not None]
    assert nums and len(nums) == len(set(nums))


def test_registered_plates_are_collision_free():
    rng, fk = _rng_faker()
    cz = population.build_citizens(rng, fk, population.build_households(rng, fk))
    plates = [c["registered_plate"] for c in cz if c["registered_plate"] is not None]
    assert plates and len(plates) == len(set(plates))


def test_national_ids_are_collision_free():
    rng, fk = _rng_faker()
    cz = population.build_citizens(rng, fk, population.build_households(rng, fk))
    ids = [c["national_id"] for c in cz if c["national_id"] is not None]
    assert ids and len(ids) == len(set(ids))
