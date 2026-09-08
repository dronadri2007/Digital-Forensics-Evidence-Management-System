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
