"""Itinéraires cyclables balisés (relations OSM `route=bicycle`) et leur bonus.

Le scoring d'une arête ne connaît que les tags de la VOIE (`highway`,
`cycleway`, `maxspeed`, `surface`…). Il ignore ce que porte la RELATION :
l'appartenance à un itinéraire jalonné et continu — véloroute nationale,
EuroVelo, Réseau Express Vélo, RAVeL, fietssnelweg. C'est une information
qu'aucun tag de voie ne donne : un aménagement pensé comme un axe, et non comme
un tronçon isolé.

La source est OpenStreetMap, et non un jeu open data national, pour une raison
décisive : une relation liste les identifiants de ses ways membres, or les
arêtes du graphe portent déjà leur `osmid`. L'appariement est donc EXACT, une
simple intersection d'identifiants — sans index spatial, sans seuil de distance
et sans critère de couverture, contrairement à ce qu'impose `attach_lighting`.
Une seule requête couvre par ailleurs la France et la Belgique, là où les jeux
nationaux demanderaient un chargeur par pays.

Les relations n'étant pas remontées par `ox.graph_from_polygon`, on interroge
Overpass directement, et on met le résultat en cache par profil
(`graphs/<profil>.cycleroutes.json`) — même contrat que le cache d'altitudes
IGN : une donnée quasi statique, rafraîchie à la construction du graphe.
"""

import json
import os
import time
from datetime import datetime

import requests

from graph.config import (
    VELOROUTE_EXCLUDED_STATES,
    VELOROUTE_STRUCTURING_CYCLE_NETWORKS,
    VELOROUTE_STRUCTURING_MARKERS,
    VELOROUTE_STRUCTURING_NETWORKS,
    VELOROUTE_TIER_SIGNED,
    VELOROUTE_TIER_STRUCTURING,
)
from graph.extent import graph_zones

# Volontairement serrés : quand le cache manque, cette requête est sur le chemin
# du DÉMARRAGE de l'API. Un échec n'est jamais bloquant (le routage retombe sur
# le comportement d'avant la fonctionnalité, et le cache sera retenté au
# redémarrage suivant), mais une attente ne doit pas retarder la mise en service.
# Mesuré : ~10 s sur Bordeaux, ~30 s sur Tournai et ses 769 relations.
OVERPASS_TIMEOUT_S = 90
MAX_RETRIES = 2
RETRY_BACKOFF_S = 10
TIER_LABELS = {
    VELOROUTE_TIER_STRUCTURING: "axe structurant",
    VELOROUTE_TIER_SIGNED: "réseau balisé",
}


DEFAULT_USER_AGENT = "secu-cycle/1.0 (routeur cyclable ; contact via le dépôt du projet)"


def _overpass_url():
    """Endpoint Overpass, aligné sur celui d'OSMnx si le projet l'a redéfini."""
    try:
        import osmnx as ox
        base = str(ox.settings.overpass_url).rstrip("/")
        return base if base.endswith("/interpreter") else f"{base}/interpreter"
    except Exception:
        return "https://overpass-api.de/api/interpreter"


def _headers():
    """En-têtes de la requête Overpass.

    L'User-Agent est OBLIGATOIRE : le serveur répond 406 à celui que `requests`
    envoie par défaut (`python-requests/x.y`). On reprend celui d'OSMnx pour que
    toutes les requêtes du projet se présentent de la même façon.
    """
    agent = DEFAULT_USER_AGENT
    try:
        import osmnx as ox
        agent = str(ox.settings.http_user_agent) or agent
    except Exception:
        pass
    return {"User-Agent": agent}


def _route_tier(tags):
    """Niveau d'un itinéraire d'après ses tags, ou 0 s'il est à écarter.

    `cycle_network` prime sur `network` : cf. le commentaire de
    VELOROUTE_STRUCTURING_CYCLE_NETWORKS dans `graph.config`.
    """
    if (tags.get("route") or "").strip().lower() != "bicycle":
        return 0

    state = (tags.get("state") or "").strip().lower()
    if state in VELOROUTE_EXCLUDED_STATES:
        return 0

    cycle_network = (tags.get("cycle_network") or "").strip()
    if cycle_network:
        if cycle_network in VELOROUTE_STRUCTURING_CYCLE_NETWORKS:
            return VELOROUTE_TIER_STRUCTURING
        if any(marker in cycle_network for marker in VELOROUTE_STRUCTURING_MARKERS):
            return VELOROUTE_TIER_STRUCTURING

    if (tags.get("network") or "").strip().lower() in VELOROUTE_STRUCTURING_NETWORKS:
        return VELOROUTE_TIER_STRUCTURING

    # Toute autre relation `route=bicycle` active reste un itinéraire jalonné :
    # elle mérite le niveau faible, sans considération de `network` (absent sur
    # une part non négligeable des relations).
    return VELOROUTE_TIER_SIGNED


def _fetch_zone(session, zone):
    """Relations `route=bicycle` d'une zone (w, s, e, n), avec leurs membres.

    `out body` renvoie en un seul appel les tags de la relation ET la liste de
    ses membres, donc l'association way → itinéraire. Une relation est retournée
    dès qu'un de ses membres touche l'emprise : ses ways peuvent déborder très
    au-delà, ce qui est sans effet — seuls comptent ceux présents dans le graphe.
    """
    w, s, e, n = zone
    query = (
        f"[out:json][timeout:{OVERPASS_TIMEOUT_S}];"
        f'rel["route"="bicycle"]({s},{w},{n},{e});'
        "out body;"
    )

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = session.post(
                _overpass_url(), data={"data": query}, headers=_headers(),
                timeout=OVERPASS_TIMEOUT_S + 20
            )
            if response.status_code == 200:
                return response.json().get("elements", [])
            raise RuntimeError(f"HTTP {response.status_code}")
        except Exception as exc:
            print(f"[Véloroutes] Tentative {attempt}/{MAX_RETRIES} échouée : {exc}",
                  flush=True)
            if attempt == MAX_RETRIES:
                raise
            time.sleep(RETRY_BACKOFF_S * attempt)
    return []


def fetch_cycle_routes(zones):
    """Interroge Overpass sur chaque zone et renvoie (ways, routes).

    `ways`   : {identifiant de way OSM (int) -> niveau}, le plus élevé l'emporte
               quand une voie appartient à plusieurs itinéraires.
    `routes` : liste des itinéraires retenus, à seule fin de diagnostic.

    Une requête par zone contiguë, jamais sur la boîte englobante commune : sur
    un profil multi-villes, celle-ci couvrirait tout ce qui sépare les villes
    (cf. `graph.extent.graph_zones`).
    """
    ways, routes = {}, []
    excluded = 0
    session = requests.Session()

    for i, zone in enumerate(zones, start=1):
        print(f"[Véloroutes] Zone {i}/{len(zones)} : interrogation d'Overpass...",
              flush=True)
        for element in _fetch_zone(session, zone):
            if element.get("type") != "relation":
                continue

            tags = element.get("tags") or {}
            tier = _route_tier(tags)
            if not tier:
                excluded += 1
                continue

            routes.append({
                "id": element.get("id"),
                "network": tags.get("network"),
                "cycle_network": tags.get("cycle_network"),
                "ref": tags.get("ref"),
                "name": tags.get("name"),
                "tier": tier,
            })

            for member in element.get("members") or []:
                if member.get("type") != "way":
                    continue
                way_id = member.get("ref")
                if way_id is None:
                    continue
                if ways.get(way_id, 0) < tier:
                    ways[way_id] = tier

    # Une même relation peut être renvoyée par plusieurs zones.
    routes = list({route["id"]: route for route in routes}.values())

    n_struct = sum(1 for r in routes if r["tier"] == VELOROUTE_TIER_STRUCTURING)
    print(f"[Véloroutes] {len(routes)} itinéraire(s) retenu(s) "
          f"({n_struct} axe(s) structurant(s)), {excluded} écarté(s), "
          f"{len(ways)} voie(s) concernée(s).", flush=True)
    return ways, routes


def create_cycleroutes_file(G, filepath, on_progress=None):
    """Construit le cache d'itinéraires cyclables du graphe `G`.

    Échec réseau : on n'écrit rien et on laisse remonter le contexte au log. Le
    routage fonctionnera sans, à l'identique d'avant la fonctionnalité.
    """
    if on_progress is not None:
        on_progress("Itinéraires cyclables balisés", None, None)

    zones = graph_zones(G)
    if not zones:
        print("[Véloroutes] Graphe sans emprise exploitable, cache non généré.",
              flush=True)
        return False

    try:
        ways, routes = fetch_cycle_routes(zones)
    except Exception as exc:
        print(f"[Véloroutes] Récupération impossible, cache non généré : {exc}",
              flush=True)
        return False

    payload = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "zones": [list(zone) for zone in zones],
        "ways": {str(way_id): tier for way_id, tier in ways.items()},
        "routes": routes,
    }

    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, "w") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)

    print(f"[Véloroutes] Cache écrit : {filepath}", flush=True)
    return True


def _load_cache(filepath):
    """{identifiant de way -> niveau} depuis le cache, {} si absent ou illisible."""
    if not filepath or not os.path.exists(filepath):
        return {}
    try:
        with open(filepath, "r") as handle:
            payload = json.load(handle)
        return {int(way_id): int(tier)
                for way_id, tier in (payload.get("ways") or {}).items()}
    except Exception as exc:
        print(f"[Véloroutes] Cache illisible ({exc}), itinéraires balisés ignorés.",
              flush=True)
        return {}


def _edge_tier(osmid, tiers):
    """Niveau d'une arête d'après son (ou ses) identifiant(s) de way OSM.

    Une arête simplifiée par OSMnx peut fusionner plusieurs ways : on retient le
    niveau le plus élevé, si bien qu'un segment partiellement balisé bénéficie du
    bonus. Acceptable — OSMnx ne fusionne que des chaînes de degré 2 aux
    attributs identiques, donc de courtes continuités.
    """
    ids = osmid if isinstance(osmid, (list, tuple, set)) else (osmid,)
    tier = 0
    for way_id in ids:
        try:
            tier = max(tier, tiers.get(int(way_id), 0))
        except (TypeError, ValueError):
            continue
    return tier


def attach_veloroutes(G, filepath):
    """Écrit `_veloroute` (0, 1 ou 2) sur chaque arête, depuis le cache.

    Attribut en mémoire (préfixe `_`), jamais écrit dans le `.graphml`. En
    l'absence de cache, toutes les arêtes restent à 0 et le routage est
    rigoureusement inchangé — même contrat défensif que `attach_accident_risk`.
    """
    for _, _, data in G.edges(data=True):
        data['_veloroute'] = 0

    tiers = _load_cache(filepath)
    if not tiers:
        G.graph['_veloroutes_ready'] = False
        print("[Véloroutes] Aucun itinéraire balisé chargé : scores inchangés.",
              flush=True)
        return G

    total_length = 0.0
    length_by_tier = {}
    for _, _, data in G.edges(data=True):
        tier = _edge_tier(data.get('osmid'), tiers)
        data['_veloroute'] = tier
        length = float(data.get('length', 0.0) or 0.0)
        total_length += length
        if tier:
            length_by_tier[tier] = length_by_tier.get(tier, 0.0) + length

    G.graph['_veloroutes_ready'] = True

    # Part du graphe concernée, par niveau : seule boucle de calibrage disponible.
    # Un niveau « réseau balisé » qui dépasserait ~30 % du linéaire cesserait
    # d'être discriminant, et les seuils de `graph.config` seraient à resserrer.
    if total_length > 0:
        detail = ", ".join(
            f"{TIER_LABELS.get(tier, tier)} {length / total_length * 100:.1f} %"
            for tier, length in sorted(length_by_tier.items(), reverse=True)
        ) or "aucune arête concernée"
        print(f"[Véloroutes] Couverture du graphe : {detail}.", flush=True)

    return G


if __name__ == "__main__":
    # Génération isolée du cache, sans démarrer l'API :
    #     docker compose exec api python -m graph.veloroutes [--profile <nom>]
    import argparse

    import osmnx as ox

    from graph.graph_manager import load_graph_profile, profile_paths

    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--profile", help="Profil de graphe (défaut : profil actif)")
    args = parser.parse_args()

    paths = profile_paths(args.profile) if args.profile else load_graph_profile()
    print(f"Lecture du graphe {paths['graph_file']}...", flush=True)
    graph = ox.load_graphml(paths["graph_file"])

    if create_cycleroutes_file(graph, paths["cycleroutes_file"]):
        attach_veloroutes(graph, paths["cycleroutes_file"])
