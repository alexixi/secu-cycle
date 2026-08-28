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

Ce module rend des mots, il prend donc une locale — celle du destinataire, jamais
celle d'une requête. Elle traverse toutes les fonctions qui formatent : un
récapitulatif dont seule la moitié des chiffres serait traduite se verrait
immédiatement, mais seulement une fois parti.
"""

from i18n import DEFAULT_LOCALE, plural, t

# En deçà, la comparaison avec la période précédente n'a rien à dire : un premier
# mois d'utilisation afficherait une progression de plusieurs milliers de pour cent.
KM_MINIMUM_COMPARAISON = 1.0


def _decimal(valeur: float, locale: str) -> str:
    """Nombre à un chiffre après la virgule, avec le séparateur de la langue.

    Le séparateur décimal n'est pas de la cosmétique : « 7.2 km » se lit comme
    une coquille en français, et le point est ce que produit `format` quelle que
    soit la langue.
    """
    rendu = f"{valeur:.1f}"
    return rendu if locale == "en" else rendu.replace(".", ",")


def formate_duree(minutes: float, locale: str = DEFAULT_LOCALE) -> str:
    """Durée lisible : « 45 min », « 2 h », « 12 h 30 »."""
    total = int(round(minutes or 0))
    heures, reste = divmod(total, 60)
    if not heures:
        return t("email.recap.unit_minutes", locale, value=reste)
    if not reste:
        return t("email.recap.unit_hours", locale, value=heures)
    return t("email.recap.unit_hours_minutes", locale, hours=heures, minutes=f"{reste:02d}")


def formate_distance(km: float, locale: str = DEFAULT_LOCALE) -> str:
    """Distance lisible, arrondie au dixième sous 100 km et à l'unité au-delà."""
    km = km or 0.0
    if km >= 100:
        valeur = f"{km:.0f}"
    else:
        # Le dixième nul ne s'écrit pas : « 8 km » plutôt que « 8,0 km ».
        valeur = _decimal(km, locale)
        if valeur[-2:] in (".0", ",0"):
            valeur = valeur[:-2]
    return t("email.recap.unit_km", locale, value=valeur)


def _comparaison(km: float, km_precedent: float, libelle_precedent: str, locale: str):
    """Phrase de comparaison, ou `None` quand il n'y a rien d'honnête à dire.

    Muette si la période précédente est vide ou négligeable : sans cela, tout
    nouvel inscrit recevrait une progression spectaculaire et dénuée de sens.
    Muette aussi sous cinq pour cent d'écart, qui ne se distingue pas du hasard.
    """
    if not km or km_precedent < KM_MINIMUM_COMPARAISON:
        return None

    ecart = (km - km_precedent) / km_precedent * 100
    if abs(ecart) < 5:
        return t("email.recap.comparison_same", locale, periode=libelle_precedent)
    sens = "more" if ecart > 0 else "less"
    return t(f"email.recap.comparison_{sens}", locale,
             ecart=f"{abs(ecart):.0f}", periode=libelle_precedent)


def resume(brut: dict, badges: list, libelle_precedent: str,
           locale: str = DEFAULT_LOCALE) -> dict:
    """Met en forme les agrégats d'un utilisateur pour le gabarit.

    :param brut: une ligne de `recap.requetes.agregats`.
    :param badges: badges débloqués pendant la période, déjà triés et déjà
        libellés dans `locale` (voir `utils.badges.libelles`).
    :param libelle_precedent: « juin », « 2025 »… pour la phrase de comparaison.
    :param locale: langue du destinataire, issue de son profil.
    """
    trajets = int(brut.get("trajets") or 0)
    km = float(brut.get("km") or 0.0)
    minutes = float(brut.get("minutes") or 0.0)
    denivele = float(brut.get("denivele") or 0.0)
    trajets_mesures = int(brut.get("trajets_avec_denivele") or 0)

    tuiles = [
        {"libelle": t("email.recap.tile_trips", locale), "valeur": str(trajets)},
        {"libelle": t("email.recap.tile_distance", locale), "valeur": formate_distance(km, locale)},
        {"libelle": t("email.recap.tile_time", locale), "valeur": formate_duree(minutes, locale)},
    ]

    # La tuile n'apparaît que si l'altitude a réellement été mesurée. Après la
    # reprise de l'historique, les seuls trajets sans dénivelé sont ceux dont le
    # tracé n'en portait pas : afficher « 0 m » pour eux serait une affirmation
    # que la base ne soutient pas.
    if trajets_mesures and denivele > 0:
        tuiles.append({
            "libelle": t("email.recap.tile_elevation", locale),
            "valeur": t("email.recap.unit_m", locale, value=f"{denivele:.0f}"),
        })

    return {
        "trajets": trajets,
        "phrase_trajets": plural(trajets, "email.recap.trips_one",
                                 "email.recap.trips_other", locale),
        "tuiles": tuiles,
        "comparaison": _comparaison(km, float(brut.get("km_precedent") or 0.0),
                                    libelle_precedent, locale),
        "badges": [{"nom": b["name"], "description": b.get("description")} for b in badges],
        "trajet_le_plus_long": (
            formate_distance(float(brut["plus_long_km"]), locale)
            if brut.get("plus_long_km") else None
        ),
        "trajets_surs": int(brut.get("trajets_surs") or 0),
        "trajets_pluie": int(brut.get("trajets_pluie") or 0),
    }
