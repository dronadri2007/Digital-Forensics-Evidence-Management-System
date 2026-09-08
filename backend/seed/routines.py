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
    seen = set()
    for c in citizens:
        if rng.random() < 0.80:
            account_id = "AC" + "".join(str(d) for d in rng.integers(0, 10, size=10))
            while account_id in seen:
                account_id = "AC" + "".join(str(d) for d in rng.integers(0, 10, size=10))
            seen.add(account_id)
            out.append({
                "account_id": account_id,
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
    seen = set()
    for c in citizens:
        if rng.random() >= 0.30:
            continue
        n_profiles = 1 + int(rng.random() < 0.4)
        for k in range(n_profiles):
            platform = "ASHGRAM" if k == 0 else "CHIRPER"
            handle = c["full_name"].split()[0].lower() + str(int(rng.integers(10, 9999)))
            while handle in seen:
                handle = c["full_name"].split()[0].lower() + str(int(rng.integers(10, 9999)))
            seen.add(handle)
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
