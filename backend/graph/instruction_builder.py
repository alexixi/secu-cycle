"""Rendu des instructions de guidage, dans la langue de la requête.

Le module est appelé depuis ``routers/navigation.py`` uniquement, c'est-à-dire à
la sérialisation : rien de ce qu'il produit n'est mis en cache ni calculé dans
une boucle de fond, et il peut donc rendre des mots plutôt que des clés.

Les icônes restent en dur : ce sont des caractères, pas du texte. L'application
mobile n'utilise d'ailleurs pas ce champ, elle mappe elle-même ``turn_type``.
"""

from i18n import DEFAULT_LOCALE, ordinal, t

TURN_ICONS = {
    "depart":       "▶",
    "continue":     "⬆",
    "slight_right": "↗",
    "turn_right":   "→",
    "sharp_right":  "↪",
    "u_turn":       "↩",
    "sharp_left":   "↩",
    "turn_left":    "←",
    "slight_left":  "↖",
    "arrive":       "🏁",
    "roundabout":   "⟳",
}
FALLBACK_ICON = "⬆"

# Les manœuvres qui portent un libellé au catalogue. « arrive » et « roundabout »
# n'y figurent pas : les deux sont traités avant d'atteindre le cas général.
# `turn_type` vient du corps de la requête : tout ce qui sort de cette liste
# retombe sur « fallback » plutôt que d'afficher une clé brute.
LABELLED_TURNS = frozenset({
    "depart", "continue", "slight_right", "turn_right", "sharp_right",
    "u_turn", "sharp_left", "turn_left", "slight_left",
})

# Le français écrit « 1,2 km », l'anglais “1.2 km”.
DECIMAL_SEPARATOR = {"fr": ",", "en": "."}


def format_distance(meters: float, locale: str = DEFAULT_LOCALE) -> str:
    """« maintenant » / « dans 250 m » / « dans 1,2 km »."""
    if meters < 50:
        return t("guidance.distance.now", locale)

    rounded = round(meters / 10) * 10
    if rounded < 1000:
        return t("guidance.distance.meters", locale, distance=rounded)

    kilometers = f"{rounded / 1000:.1f}".replace(
        ".", DECIMAL_SEPARATOR.get(locale, ".")
    )
    return t("guidance.distance.kilometers", locale, distance=kilometers)


def _instruction(icon, text, distance_label, turn, bearing=None, exit_number=None) -> dict:
    return {
        "icon": icon,
        "text": text,
        "distance_label": distance_label,
        "turn_type": turn,
        "bearing": bearing,
        "exit_number": exit_number,
    }


def _roundabout_text(exit_number, street, locale: str) -> str:
    """Sortie de rond-point, avec ou sans rang, avec ou sans nom de rue.

    Le rang est un ordinal, donc une règle morphologique et non une chaîne :
    « 1ère » / « 3ème » contre “1st” / “3rd”. Un rond-point sans numéro de sortie
    est possible — ``exit_number`` est optionnel dans le corps de la requête — et
    donne une consigne générique plutôt qu'un rang inventé.
    """
    if exit_number is None:
        cle = "generic_street" if street else "generic"
        return t(f"guidance.roundabout.{cle}", locale, street=street)

    rang = ordinal(exit_number, locale)
    cle = "exit_street" if street else "exit"
    return t(f"guidance.roundabout.{cle}", locale, ordinal=rang, street=street)


def build_instruction(maneuver: dict, distance_m: float, locale: str = DEFAULT_LOCALE) -> dict:
    turn = maneuver.get("turn_type", "continue")
    street = maneuver.get("street_name")

    if turn == "roundabout":
        exit_number = maneuver.get("exit_number")
        return _instruction(
            TURN_ICONS["roundabout"],
            _roundabout_text(exit_number, street, locale),
            format_distance(distance_m, locale),
            turn,
            bearing=maneuver.get("bearing_after"),
            exit_number=exit_number,
        )

    if turn == "arrive":
        if distance_m > 50:
            return _instruction(
                TURN_ICONS["arrive"], t("guidance.arrival.near", locale),
                format_distance(distance_m, locale), turn,
            )
        return _instruction(
            TURN_ICONS["arrive"], t("guidance.arrival.reached", locale), "", turn,
        )

    cle = turn if turn in LABELLED_TURNS else "fallback"
    forme = "street" if street else "plain"
    return _instruction(
        TURN_ICONS.get(turn, FALLBACK_ICON),
        t(f"guidance.turn.{cle}.{forme}", locale, street=street),
        format_distance(distance_m, locale),
        turn,
        bearing=maneuver.get("bearing_after"),
    )
