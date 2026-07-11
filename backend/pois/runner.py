"""Exécute une synchro POI en la traçant dans `poi_sync_runs`.

Sert au déclenchement manuel (endpoint admin) comme à la boucle automatique :
les deux passent par ce module, si bien que tout run apparaît dans
l'historique, qu'il réussisse ou non.

La ligne de run est créée *avant* le lancement de la synchro : l'admin voit
donc l'état « en cours » dès sa requête, et cette ligne sert aussi de verrou
contre deux synchros simultanées.
"""

from sqlalchemy import select, update
from sqlalchemy.sql import func

from database import SessionLocal
from models.poi_sync import PoiSyncRun, PoiSyncSettings, SETTINGS_ID
from pois.sync import sync


def is_running(db) -> bool:
    """Une synchro est-elle déjà en cours ?

    L'API tourne avec un seul worker (contrainte mémoire, cf.
    docker-compose.prod.yml) : cette lecture suffit à empêcher deux synchros
    simultanées, sans verrou applicatif.
    """
    return db.execute(
        select(PoiSyncRun.id).where(PoiSyncRun.status == "running").limit(1)
    ).first() is not None


def fail_stale_runs() -> int:
    """Clôt les runs restés « en cours » après un crash ou un redéploiement.

    Sans cela, un run interrompu bloquerait définitivement les suivants.
    Appelé au démarrage de l'application.
    """
    db = SessionLocal()
    try:
        stale = db.execute(
            update(PoiSyncRun)
            .where(PoiSyncRun.status == "running")
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


def get_settings(db) -> PoiSyncSettings:
    """Réglages de la synchro auto, créés à la volée s'ils manquent."""
    settings = db.get(PoiSyncSettings, SETTINGS_ID)
    if settings is None:
        settings = PoiSyncSettings(id=SETTINGS_ID, interval_hours=None)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def create_run(db, trigger: str) -> PoiSyncRun:
    """Ouvre un run « en cours ». À appeler avant `execute_run`."""
    run = PoiSyncRun(trigger=trigger, status="running")
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def execute_run(run_id: int) -> None:
    """Lance la synchro et clôt le run `run_id`.

    Bloquant (plusieurs minutes : Overpass) — appeler via `asyncio.to_thread`
    pour ne pas figer l'event loop.
    """
    db = SessionLocal()
    try:
        run = db.get(PoiSyncRun, run_id)
        if run is None:
            return

        try:
            stats = sync()
        except Exception as exc:
            run.status = "failed"
            run.finished_at = func.clock_timestamp()
            run.error = str(exc)[:2000]
            db.commit()
            print(f"[sync-pois] Échec de la synchro {run.trigger} : {exc}", flush=True)
            return

        run.status = "success"
        run.finished_at = func.clock_timestamp()
        run.total_pois = stats["total"]
        run.created_pois = stats["created"]
        run.deleted_pois = stats["deleted"]
        db.commit()
    finally:
        db.close()


def run_sync(trigger: str) -> None:
    """Crée puis exécute un run. Bloquant, comme `execute_run`."""
    db = SessionLocal()
    try:
        if is_running(db):
            return
        run = create_run(db, trigger)
    finally:
        db.close()

    execute_run(run.id)
