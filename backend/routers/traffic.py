from fastapi import APIRouter, HTTPException
import httpx
import asyncio
import time
from datetime import datetime, timedelta

router = APIRouter(prefix="/traffic", tags=["Traffic"])

BORDEAUX_BBOX = {"lat_min": 44.78, "lat_max": 44.90, "lon_min": -0.65, "lon_max": -0.50}
AVATAR_BASE = "https://avatar.cerema.fr/api"
BATCH_SIZE = 200

_countpoints_cache = None
_countpoints_cache_time = 0
CACHE_TTL = 3600


def _parse_wkt_point(wkt_str):
    coords = wkt_str.replace("POINT", "").replace("(", "").replace(")", "").strip().split()
    return float(coords[0]), float(coords[1])


async def _fetch_countpoints():
    global _countpoints_cache, _countpoints_cache_time
    now = time.time()
    if _countpoints_cache is not None and (now - _countpoints_cache_time) < CACHE_TTL:
        return _countpoints_cache

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{AVATAR_BASE}/countpoints/?limit=10000")
        resp.raise_for_status()

    filtered = []
    for cp in resp.json():
        try:
            lon, lat = _parse_wkt_point(cp["punctual_position"])
            if (BORDEAUX_BBOX["lat_min"] <= lat <= BORDEAUX_BBOX["lat_max"] and
                    BORDEAUX_BBOX["lon_min"] <= lon <= BORDEAUX_BBOX["lon_max"]):
                filtered.append({
                    "id": cp["id"],
                    "name": cp.get("count_point_name", ""),
                    "lat": lat,
                    "lon": lon,
                })
        except Exception:
            continue

    _countpoints_cache = filtered
    _countpoints_cache_time = now
    return filtered


async def _fetch_measures_batch(client, ids_batch, start, end):
    ids_str = ",".join(str(i) for i in ids_batch)
    resp = await client.get(
        f"{AVATAR_BASE}/fixed_measures/",
        params={
            "count_point_ids": ids_str,
            "start_time": start,
            "end_time": end,
            "time_zone": "Europe/Paris",
            "limit": 10000,
        },
    )
    resp.raise_for_status()
    return resp.json()


def _traffic_level(v, t, q):
    v_score = None
    q_score = None

    if v is not None:
        if v >= 70:   v_score = 0.0
        elif v >= 50: v_score = 0.2
        elif v >= 30: v_score = 0.5
        else:         v_score = 1.0

    if q is not None:
        if q < 200:   q_score = 0.0
        elif q < 500: q_score = 0.3
        elif q < 800: q_score = 0.7
        else:         q_score = 1.0

    if v_score is not None and q_score is not None:
        danger = v_score * 0.6 + q_score * 0.4
    elif v_score is not None:
        danger = v_score
    elif q_score is not None:
        danger = q_score
    elif t is not None:
        danger = 0.0 if t < 10 else (0.5 if t < 25 else 1.0)
    else:
        return "gray"

    if danger < 0.35:  return "green"
    if danger < 0.65:  return "orange"
    return "red"


@router.get("/")
async def get_traffic():
    try:
        countpoints = await _fetch_countpoints()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erreur récupération points Cerema : {e}")

    if not countpoints:
        return []

    now = datetime.utcnow()
    start = (now - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%S")
    end = now.strftime("%Y-%m-%dT%H:%M:%S")

    all_ids = [cp["id"] for cp in countpoints]
    batches = [all_ids[i:i + BATCH_SIZE] for i in range(0, len(all_ids), BATCH_SIZE)]

    measures = []
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            tasks = [_fetch_measures_batch(client, batch, start, end) for batch in batches]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, list):
                    measures.extend(r)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erreur récupération mesures Cerema : {e}")

    latest = {}
    for m in measures:
        cp_id = m.get("count_point_id")
        dt = m.get("dt", "")
        if cp_id not in latest or dt > latest[cp_id].get("dt", ""):
            latest[cp_id] = m

    cp_by_id = {cp["id"]: cp for cp in countpoints}
    result = []
    for cp_id, m in latest.items():
        cp = cp_by_id.get(cp_id)
        if not cp:
            continue
        v = m.get("v")
        t = m.get("t")
        q = m.get("q")
        result.append({
            "id": cp_id,
            "name": cp["name"],
            "lat": cp["lat"],
            "lon": cp["lon"],
            "speed": v,
            "flow": q,
            "occupancy": t,
            "level": _traffic_level(v, t, q),
        })

    return result
