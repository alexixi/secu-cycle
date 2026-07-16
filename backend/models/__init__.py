"""Importe tous les modèles pour peupler `Base.metadata`.

Alembic inspecte `Base.metadata` pour autogénérer les migrations : une table
dont le module n'a jamais été importé y est absente, et l'autogénération
proposerait de la supprimer. Importer le package suffit à les enregistrer.
"""

from models import (  # noqa: F401
    badge,
    bike,
    email_verification,
    faq,
    graph_profile,
    history,
    home_case,
    poi,
    poi_sync,
    report,
    route,
    tag,
    task,
    user,
)
