from typing import Optional

TURN_LABELS = {
    "depart":       ("Partez",                  "▶"),
    "continue":     ("Continuez tout droit",    "⬆"),
    "slight_right": ("Gardez la droite",        "↗"),
    "turn_right":   ("Tournez à droite",        "→"),
    "sharp_right":  ("Virage serré à droite",   "↪"),
    "u_turn":       ("Faites demi-tour",        "↩"),
    "sharp_left":   ("Virage serré à gauche",   "↩"),
    "turn_left":    ("Tournez à gauche",        "←"),
    "slight_left":  ("Gardez la gauche",        "↖"),
    "arrive":       ("Vous êtes arrivé",        "🏁"),
    "roundabout":   ("Rond-point",              "⟳"),
}

ORDINALS = {1: "1ère", 2: "2ème", 3: "3ème", 4: "4ème", 5: "5ème"}


def format_distance(meters: float) -> str:
    if meters < 50:
        return "maintenant"
    if meters < 1000:
        return f"dans {round(meters / 10) * 10} m"
    return f"dans {meters / 1000:.1f} km"


def build_instruction(maneuver: dict, distance_m: float) -> dict:
    turn = maneuver.get("turn_type", "continue")
    street = maneuver.get("street_name")

    if turn == "roundabout":
        exit_n = maneuver.get("exit_number") or "?"
        ordinal = ORDINALS.get(exit_n, f"{exit_n}ème")
        text = f"Prenez la {ordinal} sortie du rond-point"
        if street:
            text += f" sur {street}"
        return {
            "icon": "⟳",
            "text": text,
            "distance_label": format_distance(distance_m),
            "turn_type": turn,
            "bearing": maneuver.get("bearing_after"),
            "exit_number": exit_n,
        }

    label, icon = TURN_LABELS.get(turn, ("Continuez", "⬆"))
    text = f"{label} sur {street}" if street else label

    return {
        "icon": icon,
        "text": text,
        "distance_label": format_distance(distance_m),
        "turn_type": turn,
        "bearing": maneuver.get("bearing_after"),
        "exit_number": None,
    }