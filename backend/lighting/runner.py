"""Exécute une synchro d'éclairage en la traçant dans `street_lamp_sync_runs`.

Sert au déclenchement manuel (endpoint admin) comme à la boucle automatique.
Après une synchro réussie, `refresh_graph` réinjecte l'éclairage dans le graphe
chargé (inférence `lit`) sans redémarrage.
"""

from sqlalchemy import select, update
from sqlalchemy.sql import func

from database import SessionLocal
from lighting.sync import sync
from models.street_lamp_sync import (
    StreetLampSyncRun, StreetLampSyncSettings, SETTINGS_ID,
)


def is_running(db) -> bool:
    return db.execute(
        select(StreetLampSyncRun.id).where(StreetLampSyncRun.status == "running").limit(1)
    ).first() is not None


def fail_stale_runs() -> int:
    """Clôt les runs restés « en cours » après un crash ou un redéploiement."""
    db = SessionLocal()
    try:
        stale = db.execute(
            update(StreetLampSyncRun)
            .where(StreetLampSyncRun.status == "running")
            .values(
                status="failed",
                finished_at=func.now(),
                error="Synchronisation interrompue par un arrêt du serveur.",
            )
        ).rowcount
        db.commit()
        return stale
    finally:
        db.close()


def get_settings(db) -> StreetLampSyncSettings:
    """Réglages de la synchro auto, créés à la volée s'ils manquent."""
    settings = db.get(StreetLampSyncSettings, SETTINGS_ID)
    if settings is None:
        settings = StreetLampSyncSettings(id=SETTINGS_ID, interval_days=None)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def create_run(db, trigger: str) -> StreetLampSyncRun:
    """Ouvre un run « en cours ». À appeler avant `execute_run`."""
    run = StreetLampSyncRun(trigger=trigger, status="running")
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def execute_run(run_id: int, app=None) -> None:
    """Lance la synchro et clôt le run `run_id`.

    Bloquant (Overpass + portails open data) — appeler via `asyncio.to_thread`.
    """
    db = SessionLocal()
    try:
        run = db.get(StreetLampSyncRun, run_id)
        if run is None:
            return

        try:
            stats = sync()
        except Exception as exc:
            run.status = "failed"
            run.finished_at = func.clock_timestamp()
            run.error = str(exc)[:2000]
            db.commit()
            print(f"[sync-lighting] Échec de la synchro {run.trigger} : {exc}", flush=True)
            return

        run.status = "success"
        run.finished_at = func.clock_timestamp()
        run.total_lamps = stats["total"]
        run.created_lamps = stats["created"]
        run.deleted_lamps = stats["deleted"]
        db.commit()
    finally:
        db.close()

    refresh_graph(app)


def refresh_graph(app) -> None:
    """Réinjecte l'éclairage dans le graphe chargé et vide le cache d'itinéraires."""
    if app is None or getattr(app.state, "G", None) is None:
        return

    from graph.lighting import attach_lighting
    from graph.route_cache import route_cache
    from graph.routing import precompute_static_costs

    attach_lighting(app.state.G)
    precompute_static_costs(app.state.G)
    route_cache.invalidate()
    print("[sync-lighting] Éclairage réactualisé sur le graphe chargé.", flush=True)


def run_sync(trigger: str, app=None) -> None:
    """Crée puis exécute un run. Bloquant, comme `execute_run`."""
    db = SessionLocal()
    try:
        if is_running(db):
            return
        run = create_run(db, trigger)
    finally:
        db.close()

    execute_run(run.id, app)
