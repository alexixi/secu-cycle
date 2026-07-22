"""Récupération des accidents corporels géolocalisés, une source par pays.

Chaque provider renvoie des lignes déjà normalisées vers le schéma de
`models.accident.RoadAccident` : même échelle de gravité, mêmes noms de
propriétés, coordonnées en WGS84. La carte et le scoring n'ont donc jamais à
savoir de quel pays vient un point.

Ajouter un pays = ajouter un provider et une entrée dans `PROVIDERS`.
"""

import csv
import hashlib
import io
import tempfile
import zipfile
from datetime import date

import httpx
from shapely.geometry import Point
from shapely.prepared import prep

from accidents import config
from models.accident import SEVERITY_BY_BAAC_GRAV, SEVERITY_LABELS


class AccidentSourceError(RuntimeError):
    """La source amont est indisponible ou a répondu quelque chose d'inattendu."""


def _as_int(value):
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def _zone_filter(zones):
    """Prédicat « ce point est-il dans l'emprise du profil ? ».

    On préfère les polygones des communes à leur boîte englobante : sur un
    profil transfrontalier, la bbox de « Tournai + Mouscron » avale des dizaines
    de kilomètres de territoire non couvert par le graphe, dont les accidents
    n'auraient aucun segment auquel se rattacher.
    """
    prepared = [prep(zone) for zone in zones]

    def inside(lon, lat):
        point = Point(lon, lat)
        return any(zone.contains(point) for zone in prepared)

    return inside


def _bounds(zones):
    """Boîte englobante (lon_min, lat_min, lon_max, lat_max) de toutes les zones."""
    xs_min, ys_min, xs_max, ys_max = zip(*(zone.bounds for zone in zones))
    return min(xs_min), min(ys_min), max(xs_max), max(ys_max)


class FranceBaacProvider:
    """Accidents cyclistes français, dérivés des bases BAAC de l'ONISR.

    Une ligne amont = un **usager** impliqué ; on regroupe donc sur `Num_Acc`
    en retenant la gravité la plus élevée, pour obtenir un point par accident.
    """

    source = "baac"
    country = "fr"
    label = "BAAC / ONISR (France)"

    def fetch(self, zones, since_year):
        lon_min, lat_min, lon_max, lat_max = _bounds(zones)
        inside = _zone_filter(zones)

        params = {
            "size": config.BAAC_PAGE_SIZE,
            "bbox": f"{lon_min},{lat_min},{lon_max},{lat_max}",
            "select": ",".join(config.BAAC_FIELDS),
        }

        by_accident = {}
        url = config.BAAC_API_URL
        pages = 0

        with httpx.Client(timeout=config.HTTP_TIMEOUT_S, follow_redirects=True) as client:
            while url:
                try:
                    response = client.get(url, params=params if pages == 0 else None)
                    response.raise_for_status()
                    payload = response.json()
                except Exception as exc:
                    raise AccidentSourceError(
                        f"Interrogation du dérivé BAAC impossible : {exc}"
                    ) from exc

                for row in payload.get("results", []):
                    self._accumulate(by_accident, row, since_year, inside)

                pages += 1
                url = payload.get("next")

        print(f"[sync-accidents] BAAC : {pages} page(s), {len(by_accident)} accident(s) retenu(s).",
              flush=True)
        return list(by_accident.values())

    def _accumulate(self, by_accident, row, since_year, inside):
        num_acc = str(row.get("Num_Acc") or "").strip()
        if not num_acc:
            return

        lat, lon = row.get("lat"), row.get("long")
        if not lat or not lon:
            return

        year = _as_int(row.get("an"))
        if year is not None and year < since_year:
            return

        if not inside(float(lon), float(lat)):
            return

        severity = SEVERITY_BY_BAAC_GRAV.get(_as_int(row.get("grav")), 1)

        existing = by_accident.get(num_acc)
        if existing is not None:
            existing["severity"] = max(existing["severity"], severity)
            existing["properties"]["severity_label"] = SEVERITY_LABELS.get(
                existing["severity"])
            existing["properties"]["victims"] += 1
            return

        by_accident[num_acc] = {
            "source": self.source,
            "source_ref": num_acc,
            "country": self.country,
            "latitude": float(lat),
            "longitude": float(lon),
            "occurred_on": self._parse_date(row.get("date"), year),
            "severity": severity,
            "involves_bicycle": True,
            "properties": {
                "victims": 1,
                "year": year,
                "severity_label": SEVERITY_LABELS.get(severity),
                "light": config.BAAC_LUM.get(_as_int(row.get("lum"))),
                "weather": config.BAAC_ATM.get(_as_int(row.get("atm"))),
                "collision": config.BAAC_COL.get(_as_int(row.get("col"))),
                "road_type": config.BAAC_CATR.get(_as_int(row.get("catr"))),
                "intersection": config.BAAC_INT.get(_as_int(row.get("int"))),
                "in_town": _as_int(row.get("agg")) == 2,
            },
        }

    @staticmethod
    def _parse_date(raw, year):
        if raw:
            try:
                return date.fromisoformat(str(raw)[:10])
            except ValueError:
                pass
        return date(year, 1, 1) if year else None


class BelgiumStatbelProvider:
    """Accidents cyclistes belges, publiés par Statbel (fichier « XY »).

    Deux différences structurelles avec la France, qui se répercutent sur ce
    qu'on peut en dire :

    - la date est publiée au **mois** près (année + mois + heure, pas de jour) :
      `occurred_on` pointe donc le 1er du mois ;
    - le fichier n'a **pas d'identifiant d'accident** : `source_ref` est une
      empreinte des champs qui identifient la collision, ce qui rend la synchro
      idempotente d'un run à l'autre.
    """

    source = "statbel"
    country = "be"
    label = "Statbel (Belgique)"

    SEVERITY_BY_CLASS = {"1": 10, "2": 10, "3": 3, "4": 1}

    def fetch(self, zones, since_year):
        from pyproj import Transformer

        inside = _zone_filter(zones)
        min_year = max(since_year, config.STATBEL_MIN_YEAR)

        to_wgs84 = Transformer.from_crs(config.STATBEL_CRS, "EPSG:4326", always_xy=True)
        to_lambert = Transformer.from_crs("EPSG:4326", config.STATBEL_CRS, always_xy=True)
        lambert_bounds = self._lambert_bounds(zones, to_lambert)

        rows = {}
        with tempfile.TemporaryFile() as archive:
            self._download(archive)
            archive.seek(0)
            with zipfile.ZipFile(archive) as zf:
                name = zf.namelist()[0]
                with zf.open(name) as raw:
                    stream = io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")
                    for record in csv.DictReader(stream, delimiter="|"):
                        self._accumulate(rows, record, min_year, lambert_bounds,
                                         to_wgs84, inside)

        print(f"[sync-accidents] Statbel : {len(rows)} accident(s) retenu(s).", flush=True)
        return list(rows.values())

    def _download(self, target):
        """Télécharge l'archive (8 Mo) en flux, sans la garder en mémoire."""
        try:
            with httpx.stream("GET", config.STATBEL_ZIP_URL,
                              timeout=config.HTTP_TIMEOUT_S,
                              follow_redirects=True) as response:
                response.raise_for_status()
                for chunk in response.iter_bytes():
                    target.write(chunk)
        except Exception as exc:
            raise AccidentSourceError(
                f"Téléchargement du fichier Statbel impossible : {exc}"
            ) from exc

    @staticmethod
    def _lambert_bounds(zones, to_lambert):
        """Emprise du profil exprimée en Lambert 72, avec une marge.

        Filtrer en Lambert avant de reprojeter évite de faire passer les 290 000
        lignes du fichier par le transformateur : seules les quelques centaines
        qui tombent dans l'emprise sont converties.
        """
        lon_min, lat_min, lon_max, lat_max = _bounds(zones)
        xs, ys = to_lambert.transform(
            [lon_min, lon_min, lon_max, lon_max],
            [lat_min, lat_max, lat_min, lat_max],
        )
        margin = 500.0
        return min(xs) - margin, min(ys) - margin, max(xs) + margin, max(ys) + margin

    def _accumulate(self, rows, record, min_year, lambert_bounds, to_wgs84, inside):
        usr1 = (record.get("CD_ROAD_USR_TYPE1") or "").strip()
        usr2 = (record.get("CD_ROAD_USR_TYPE2") or "").strip()
        if config.STATBEL_BICYCLE_CODE not in (usr1, usr2):
            return

        year = _as_int(record.get("DT_YEAR_COLLISION"))
        if year is None or year < min_year:
            return

        x = self._number(record.get("MS_X_COORD"))
        y = self._number(record.get("MS_Y_COORD"))
        if x is None or y is None:
            return

        x_min, y_min, x_max, y_max = lambert_bounds
        if not (x_min <= x <= x_max and y_min <= y <= y_max):
            return

        lon, lat = to_wgs84.transform(x, y)
        if not inside(lon, lat):
            return

        month = _as_int(record.get("DT_MONTH_COLLISION")) or 1
        hour = _as_int(record.get("DT_TIME"))
        severity = self.SEVERITY_BY_CLASS.get(
            (record.get("CD_CLASS_ACCIDENTS") or "").strip(), 1)

        # Pas d'identifiant amont : l'empreinte des champs identifiants tient lieu
        # de clé stable, sinon chaque synchro recréerait tous les points.
        digest = hashlib.sha1(
            "|".join(str(record.get(field) or "") for field in (
                "DT_YEAR_COLLISION", "DT_MONTH_COLLISION", "DT_TIME", "CD_NIS",
                "MS_X_COORD", "MS_Y_COORD", "CD_ROAD_USR_TYPE1", "CD_ROAD_USR_TYPE2",
                "CD_CLASS_ACCIDENTS", "CD_COLLISION_TYPE",
            )).encode(),
            usedforsecurity=False,
        ).hexdigest()

        rows[digest] = {
            "source": self.source,
            "source_ref": digest,
            "country": self.country,
            "latitude": lat,
            "longitude": lon,
            "occurred_on": date(year, min(max(month, 1), 12), 1),
            "severity": severity,
            "involves_bicycle": True,
            "properties": {
                "victims": 1,
                "year": year,
                "hour": hour,
                "date_precision": "month",
                "severity_label": SEVERITY_LABELS.get(severity),
                "light": self._text(record, "TX_LIGHT_CONDITION_FR"),
                "weather": self._text(record, "TX_WEATHER_FR"),
                "collision": self._text(record, "TX_COLLISON_TYPE_FR"),
                "road_type": self._text(record, "CD_ROAD_TYPE_FR"),
                "intersection": self._text(record, "TX_CROSSWAY_FR"),
                "in_town": (record.get("CD_BUILD_UP_AREA") or "").strip() == "1",
                "users": [u for u in (self._text(record, "TX_ROAD_USR_TYPE1_FR"),
                                      self._text(record, "TX_ROAD_USR_TYPE2_FR")) if u],
            },
        }

    @staticmethod
    def _number(raw):
        """Statbel publie les coordonnées avec une virgule décimale."""
        if not raw:
            return None
        try:
            return float(str(raw).strip().replace(",", "."))
        except ValueError:
            return None

    @staticmethod
    def _text(record, field):
        value = (record.get(field) or "").strip()
        return value or None


PROVIDERS = {
    provider.country: provider
    for provider in (FranceBaacProvider(), BelgiumStatbelProvider())
}


def providers_for(countries):
    """Providers correspondant aux pays d'un profil, dans l'ordre donné.

    Un pays sans source branchée est signalé mais n'interrompt rien : le profil
    reste synchronisable pour les pays couverts.
    """
    selected = []
    for code in countries:
        provider = PROVIDERS.get(code)
        if provider is None:
            print(f"[sync-accidents] Aucune source d'accidentologie pour « {code} ».",
                  flush=True)
            continue
        selected.append(provider)
    return selected
