"""Génère le graphe d'un profil, en traçant chaque build dans `graph_build_runs`.

Calqué sur `pois/runner.py` : la ligne de run est créée avant le lancement, sert
de verrou contre deux builds simultanés, et l'issue (succès ou échec) est
toujours enregistrée.
"""

import os

from sqlalchemy import select, update
from sqlalchemy.sql import func

from database import SessionLocal
from graph.graph_manager import create_graph, profile_paths
from models.graph_profile import GraphBuildRun, GraphProfile


def is_running(db) -> bool:
    """Un build est-il déjà en cours ?

    L'API tourne avec un seul worker (contrainte mémoire, cf.
    docker-compose.prod.yml) : cette lecture suffit à sérialiser les builds.
    """
    return db.execute(
        select(GraphBuildRun.id).where(GraphBuildRun.status == "running").limit(1)
    ).first() is not None


def fail_stale_runs() -> int:
    """Clôt les builds restés « en cours » après un crash ou un redéploiement."""
    db = SessionLocal()
    try:
        stale = db.execute(
            update(GraphBuildRun)
            .where(GraphBuildRun.status == "running")
            .values(
                status="failed",
                finished_at=func.now(),
                error="Génération interrompue par un arrêt du serveur.",
            )
        ).rowcount
        db.commit()
        return stale
    finally:
        db.close()


def count_graphml(path: str) -> tuple[int, int]:
    """Compte les nœuds et arêtes d'un .graphml sans le charger en mémoire.

    Les profils repris de l'ancienne configuration ont un graphe sur disque mais
    n'ont jamais été générés depuis le dashboard : leurs compteurs sont donc
    inconnus. Les parser avec osmnx coûterait ~1 Go de RAM ; un simple comptage
    de balises suffit (0,12 s pour les 93 Mo de Bordeaux).
    """
    nodes = edges = 0
    overlap = b""
    keep = len(b"<node ") - 1

    with open(path, "rb") as f:
        while chunk := f.read(1 << 20):
            buffer = overlap + chunk
            nodes += buffer.count(b"<node ")
            edges += buffer.count(b"<edge ")
            overlap = buffer[-keep:]

    return nodes, edges


def graph_stats(name: str) -> dict:
    """Taille sur disque du graphe d'un profil. `size_bytes` vaut None s'il n'existe pas."""
    graph_file = profile_paths(name)["graph_file"]
    exists = os.path.exists(graph_file)
    return {
        "exists": exists,
        "size_bytes": os.path.getsize(graph_file) if exists else None,
    }


def create_run(db, profile: GraphProfile) -> GraphBuildRun:
    """Ouvre un build « en cours ». À appeler avant `execute_build`."""
    run = GraphBuildRun(
        profile_id=profile.id,
        profile_name=profile.name,
        status="running",
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def execute_build(run_id: int, wipe_ign: bool = False) -> None:
    """Régénère le graphe du profil du run `run_id`.

    Bloquant (plusieurs minutes : Overpass puis altitudes IGN) — appeler via
    `asyncio.to_thread` pour ne pas figer l'event loop.
    """
    db = SessionLocal()
    try:
        run = db.get(GraphBuildRun, run_id)
        if run is None:
            return

        profile = db.get(GraphProfile, run.profile_id)
        if profile is None:
            _fail(db, run, "Profil introuvable.")
            return

        paths = profile_paths(profile.name)
        communes = list(profile.communes or [])
        if not communes:
            _fail(db, run, "Le profil ne contient aucune commune.")
            return

        def on_progress(step, done, total):
            """Publie l'avancement pour la barre de progression du dashboard.

            Écrit seulement quand l'affichage changerait vraiment : le lot d'un
            gros graphe passe des centaines de fois ici, inutile d'en faire
            autant d'écritures.
            """
            percent = round(done / total * 100) if total else None
            if (step, percent) == (run.step, run.progress):
                return
            run.step = step
            run.progress = percent
            db.commit()

        try:
            if os.path.exists(paths["graph_file"]):
                os.remove(paths["graph_file"])
            if wipe_ign and os.path.exists(paths["ign_cache_file"]):
                os.remove(paths["ign_cache_file"])
            if os.path.exists(paths["cycleroutes_file"]):
                os.remove(paths["cycleroutes_file"])

            G = create_graph(
                paths["graph_file"], paths["ign_cache_file"], communes, on_progress,
                paths["cycleroutes_file"]
            )
        except Exception as exc:
            _fail(db, run, str(exc))
            print(f"[build-graph] Échec de la génération de '{profile.name}' : {exc}", flush=True)
            return

        nodes = G.number_of_nodes()
        edges = G.number_of_edges()
        size_bytes = graph_stats(profile.name)["size_bytes"]

        run.status = "success"
        run.step = None
        run.progress = 100
        run.finished_at = func.clock_timestamp()
        run.nodes = nodes
        run.edges = edges
        run.size_bytes = size_bytes

        profile.nodes = nodes
        profile.edges = edges
        profile.size_bytes = size_bytes
        profile.built_at = func.clock_timestamp()
        profile.built_communes = communes

        db.commit()
        print(
            f"[build-graph] '{profile.name}' généré : {nodes} nœuds, {edges} arêtes.",
            flush=True,
        )
    finally:
        db.close()


def _fail(db, run: GraphBuildRun, message: str) -> None:
    run.status = "failed"
    run.finished_at = func.clock_timestamp()
    run.error = message[:2000]
    db.commit()
