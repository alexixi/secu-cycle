"""Accès à la source météo (Open-Meteo). I/O pur, sans état.

Une seule requête, `fetch_points` : conditions courantes, prévision horaire et
nowcast 15 min sur les **points de mesure** du profil (cf.
`graph.extent.sample_points`). C'est de là que viennent le résumé affiché, les
alertes, l'équipement et la suggestion de décalage de départ.

Il n'y a délibérément pas de maille régulière : une maille dépense l'essentiel de
son budget sur des champs. Les points sont placés par densité de réseau, donc là
où il y a des cyclistes, et leur nombre s'adapte au profil.

Comme pour la qualité de l'air, toutes les coordonnées partent en une seule
requête : Open-Meteo accepte des listes `latitude=...,...&longitude=...,...` et
répond par une liste d'objets dans l'ordre envoyé — un objet seul pour un point
unique, qu'on enveloppe pour homogénéiser.
"""

import logging

import httpx

from weather import config

logger = logging.getLogger(__name__)


def _base_params(points: list[tuple[float, float]]) -> dict:
    """Coordonnées et réglages communs aux deux requêtes."""
    params = {
        "latitude": ",".join(f"{lat:.4f}" for lat, _ in points),
        "longitude": ",".join(f"{lon:.4f}" for _, lon in points),
        # `timezone=auto` résout le fuseau **par localisation** et renvoie
        # `utc_offset_seconds`, qu'on répercute dans le payload. Sans lui, les
        # horodatages seraient en UTC alors que les fronts affichent des heures
        # locales, et « l'averse de 16 h » tomberait à 18 h en été.
        "timezone": "auto",
    }
    if config.API_KEY:
        params["apikey"] = config.API_KEY
    return params


async def _get(params: dict) -> list[dict]:
    """Appelle la source et homogénéise la réponse en liste."""
    async with httpx.AsyncClient(
        timeout=config.HTTP_TIMEOUT_S,
        headers={"User-Agent": config.USER_AGENT},
    ) as client:
        response = await client.get(config.URL, params=params)
        response.raise_for_status()
        data = response.json()

    # Un seul point → objet ; plusieurs → tableau. On homogénéise en liste.
    if isinstance(data, dict):
        data = [data]
    return data


async def fetch_points(
    points: list[tuple[float, float]],
    minutely: list[bool],
) -> list[dict]:
    """Courant, prévision horaire et nowcast 15 min des points de mesure.

    `minutely[i]` dit si le point i est dans `MINUTELY_COVERAGE`. Si aucun ne
    l'est, le bloc `minutely_15` n'est pas demandé du tout : hors couverture
    ICON-D2 / AROME, Open-Meteo l'interpole depuis l'horaire sans le signaler, et
    un nowcast interpolé présenté comme un nowcast est un mensonge.

    Il n'est pas demandable *par point* — le paramètre vaut pour toute la requête.
    Dès qu'un point est couvert, on le demande pour tous et c'est le service qui
    écarte les séries des points non couverts.
    """
    if not points:
        return []

    params = _base_params(points)
    params["current"] = ",".join(config.CURRENT_VARS)
    params["hourly"] = ",".join(config.ZONE_HOURLY_VARS)
    params["forecast_hours"] = config.FORECAST_HOURS

    if any(minutely):
        params["minutely_15"] = ",".join(config.ZONE_MINUTELY_VARS)
        params["forecast_minutely_15"] = config.FORECAST_MINUTELY_15

    return await _get(params)
