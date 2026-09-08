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
