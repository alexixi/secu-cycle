"""Des chiffres bruts de la base aux chiffres qu'on ose écrire dans un e-mail.

Couche purement fonctionnelle, placée entre le SQL et le gabarit. Elle existe
parce que les décisions qu'elle prend sont exactement celles qui rendraient un
récapitulatif embarrassant si elles étaient prises à la légère : afficher
« +∞ % » à un nouvel inscrit, annoncer « 0 m de dénivelé » sur des trajets dont
l'altitude n'a jamais été mesurée, ou écrire « 1 trajets ».

Deux formulations sont contraintes par ce que la base contient réellement :

- `duration_min` est une durée **estimée au calcul de l'itinéraire**, jamais
  chronométrée — il n'existe pas de `started_at`. On écrit donc « temps estimé »,
  et jamais « temps passé à vélo ».
- `user_badges.obtained_at` date l'**évaluation** du badge, faite à l'arrivée d'un
  trajet, pas le trajet qui l'a déclenché. On écrit « badges débloqués en
  juillet », et jamais « grâce à vos trajets de juillet ».
"""

# En deçà, la comparaison avec la période précédente n'a rien à dire : un premier
# mois d'utilisation afficherait une progression de plusieurs milliers de pour cent.
KM_MINIMUM_COMPARAISON = 1.0


def _pluriel(nombre: int, singulier: str, pluriel: str = None) -> str:
    return f"{nombre} {singulier if nombre <= 1 else (pluriel or singulier + 's')}"


def formate_duree(minutes: float) -> str:
    """Durée lisible : « 45 min », « 2 h », « 12 h 30 »."""
    total = int(round(minutes or 0))
    heures, reste = divmod(total, 60)
    if not heures:
        return f"{reste} min"
    if not reste:
        return f"{heures} h"
    return f"{heures} h {reste:02d}"


def formate_distance(km: float) -> str:
    """Distance lisible, arrondie au dixième sous 100 km et à l'unité au-delà."""
    km = km or 0.0
    return f"{km:.0f} km" if km >= 100 else f"{km:.1f} km".replace(".0 km", " km")


def _comparaison(km: float, km_precedent: float, libelle_precedent: str):
    """Phrase de comparaison, ou `None` quand il n'y a rien d'honnête à dire.

    Muette si la période précédente est vide ou négligeable : sans cela, tout
    nouvel inscrit recevrait une progression spectaculaire et dénuée de sens.
    Muette aussi sous cinq pour cent d'écart, qui ne se distingue pas du hasard.
    """
    if not km or km_precedent < KM_MINIMUM_COMPARAISON:
        return None

    ecart = (km - km_precedent) / km_precedent * 100
    if abs(ecart) < 5:
        return f"Soit à peu près autant qu'en {libelle_precedent}."
    if ecart > 0:
        return f"Soit {ecart:.0f} % de plus qu'en {libelle_precedent}."
    return f"Soit {abs(ecart):.0f} % de moins qu'en {libelle_precedent}."


def resume(brut: dict, badges: list, libelle_precedent: str) -> dict:
    """Met en forme les agrégats d'un utilisateur pour le gabarit.

    :param brut: une ligne de `recap.requetes.agregats`.
    :param badges: badges débloqués pendant la période, déjà triés.
    :param libelle_precedent: « juin », « 2025 »… pour la phrase de comparaison.
    """
    trajets = int(brut.get("trajets") or 0)
    km = float(brut.get("km") or 0.0)
    minutes = float(brut.get("minutes") or 0.0)
    denivele = float(brut.get("denivele") or 0.0)
    trajets_mesures = int(brut.get("trajets_avec_denivele") or 0)

    tuiles = [
        {"libelle": "Trajets", "valeur": str(trajets)},
        {"libelle": "Distance", "valeur": formate_distance(km)},
        {"libelle": "Temps estimé", "valeur": formate_duree(minutes)},
    ]

    # La tuile n'apparaît que si l'altitude a réellement été mesurée. Après la
    # reprise de l'historique, les seuls trajets sans dénivelé sont ceux dont le
    # tracé n'en portait pas : afficher « 0 m » pour eux serait une affirmation
    # que la base ne soutient pas.
    if trajets_mesures and denivele > 0:
        tuiles.append({"libelle": "Dénivelé", "valeur": f"{denivele:.0f} m"})

    return {
        "trajets": trajets,
        "phrase_trajets": _pluriel(trajets, "trajet"),
        "tuiles": tuiles,
        "comparaison": _comparaison(km, float(brut.get("km_precedent") or 0.0), libelle_precedent),
        "badges": [{"nom": b["name"], "description": b.get("description")} for b in badges],
        "trajet_le_plus_long": (
            formate_distance(float(brut["plus_long_km"]))
            if brut.get("plus_long_km") else None
        ),
        "trajets_surs": int(brut.get("trajets_surs") or 0),
        "trajets_pluie": int(brut.get("trajets_pluie") or 0),
    }
