"""Liste des administrateurs définie par configuration (variable d'environnement).

Un compte est considéré administrateur s'il porte le flag `is_admin` en base
OU si son adresse e-mail figure dans `ADMIN_EMAILS` (liste séparée par des
virgules). Cela permet de désigner des admins sans modifier la base — et de
résoudre l'amorçage du tout premier administrateur.
"""

import os


def _parse(raw: str) -> set[str]:
    return {email.strip().lower() for email in raw.split(",") if email.strip()}


# Évalué une fois au chargement du module.
ADMIN_EMAILS: set[str] = _parse(os.getenv("ADMIN_EMAILS", ""))


def is_admin_email(email: str | None) -> bool:
    """Vrai si l'e-mail figure dans la liste d'admins configurée."""
    return bool(email) and email.lower() in ADMIN_EMAILS


def is_user_admin(user) -> bool:
    """Statut admin effectif : flag en base OU e-mail dans `ADMIN_EMAILS`."""
    return bool(getattr(user, "is_admin", False)) or is_admin_email(getattr(user, "email", None))
