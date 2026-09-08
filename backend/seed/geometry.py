import math

from seed.constants import GRID_METERS, TOWER_IDS, CAMERA_IDS

_COVERAGE_DESCS = [
    "High St junction", "Market square", "Rail station forecourt", "Bus interchange",
    "Riverside path", "Retail park entrance", "Town hall steps", "Car park level 2",
    "Pedestrian bridge", "Cinema frontage",
]


def place_towers() -> list[dict]:
    xs = [GRID_METERS * 0.25, GRID_METERS * 0.75]
    ys = [GRID_METERS * 0.17, GRID_METERS * 0.5, GRID_METERS * 0.83]
    towers, i = [], 0
    for y in ys:
        for x in xs:
            towers.append({"tower_id": TOWER_IDS[i], "lat": round(y, 2), "lon": round(x, 2)})
            i += 1
    return towers


def place_cameras(rng) -> list[dict]:
    cams = []
    for idx, cam_id in enumerate(CAMERA_IDS):
        if idx < 21:
            lat = float(rng.uniform(600, 1400))
            lon = float(rng.uniform(600, 1400))
        else:
            lat = float(rng.uniform(0, GRID_METERS))
            lon = float(rng.uniform(0, GRID_METERS))
        cams.append({
            "camera_id": cam_id, "lat": round(lat, 2), "lon": round(lon, 2),
            "coverage_desc": _COVERAGE_DESCS[idx % len(_COVERAGE_DESCS)],
        })
    return cams


def nearest_tower(lat: float, lon: float, towers: list[dict]) -> str:
    return min(towers, key=lambda t: (t["lat"] - lat) ** 2 + (t["lon"] - lon) ** 2)["tower_id"]


def has_camera_coverage(lat: float, lon: float, cameras: list[dict], radius_m: float = 120.0) -> bool:
    return any(math.hypot(c["lat"] - lat, c["lon"] - lon) <= radius_m for c in cameras)
