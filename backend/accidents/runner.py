"""Exécute une synchro d'accidents en la traçant dans `accident_sync_runs`."""

from sqlalchemy import select, update
from sqlalchemy.sql import func

from accidents.sync import sync
from database import SessionLocal
from models.accident_sync import AccidentSyncRun, AccidentSyncSettings, SETTINGS_ID


def is_running(db) -> bool:
    return db.execute(
        select(AccidentSyncRun.id).where(AccidentSyncRun.status == "running").limit(1)
    ).first() is not None


def fail_stale_runs() -> int:
    """Clôt les runs restés « en cours » après un crash ou un redéploiement."""
    db = SessionLocal()
    try:
        stale = db.execute(
            update(AccidentSyncRun)
            .where(AccidentSyncRun.status == "running")
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


def get_settings(db) -> AccidentSyncSettings:
    """Réglages de la synchro auto, créés à la volée s'ils manquent."""
    settings = db.get(AccidentSyncSettings, SETTINGS_ID)
    if settings is None:
        settings = AccidentSyncSettings(id=SETTINGS_ID, interval_days=None)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def create_run(db, trigger: str) -> AccidentSyncRun:
    """Ouvre un run « en cours ». À appeler avant `execute_run`."""
    run = AccidentSyncRun(trigger=trigger, status="running")
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def execute_run(run_id: int, app=None) -> None:
    """Lance la synchro et clôt le run `run_id`."""
    db = SessionLocal()
    try:
        run = db.get(AccidentSyncRun, run_id)
        if run is None:
            return

        try:
            stats = sync()
        except Exception as exc:
            run.status = "failed"
            run.finished_at = func.clock_timestamp()
            run.error = str(exc)[:2000]
            db.commit()
            print(f"[sync-accidents] Échec de la synchro {run.trigger} : {exc}", flush=True)
            return

        run.status = "success"
        run.finished_at = func.clock_timestamp()
        run.total_accidents = stats["total"]
        run.created_accidents = stats["created"]
        run.deleted_accidents = stats["deleted"]
        db.commit()
    finally:
        db.close()

    refresh_graph(app)


def refresh_graph(app) -> None:
    """Recalcule les malus d'accidentologie du graphe en mémoire et vide le cache."""
    if app is None or getattr(app.state, "G", None) is None:
        return

    from graph.accidents import attach_accident_risk
    from graph.route_cache import route_cache
    from graph.routing import precompute_static_costs

    attach_accident_risk(app.state.G)
    precompute_static_costs(app.state.G)
    route_cache.invalidate()
    print("[sync-accidents] Scores de sécurité réactualisés sur le graphe chargé.",
          flush=True)


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
