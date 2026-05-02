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

def format_distance(meters: float) -> str:
    if meters < 50:
        return "maintenant"
    rounded = round(meters / 10) * 10
    if rounded < 1000:
        return f"dans {rounded} m"
    return f"dans {rounded / 1000:.1f} km"

def build_instruction(maneuver: dict, distance_m: float) -> dict:
    turn = maneuver.get("turn_type", "continue")
    street = maneuver.get("street_name")

    if turn == "roundabout":
        exit_n = maneuver.get("exit_number") or "?"
        ordinal = f"{exit_n}ème" if exit_n != 1 else "1ère"
        text = f"Au rond-point, prenez la {ordinal} sortie"
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

    if turn == "arrive":
        if distance_m > 50:
            return {
                "icon": "🏁",
                "text": "L'arrivée est proche",
                "distance_label": format_distance(distance_m),
                "turn_type": turn,
                "bearing": None,
                "exit_number": None,
            }
        else:
            return {
                "icon": "🏁",
                "text": "Vous êtes arrivé à destination",
                "distance_label": "",
                "turn_type": turn,
                "bearing": None,
                "exit_number": None,
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
