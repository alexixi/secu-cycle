"""Importe tous les modèles pour peupler `Base.metadata`.

Alembic inspecte `Base.metadata` pour autogénérer les migrations : une table
dont le module n'a jamais été importé y est absente, et l'autogénération
proposerait de la supprimer. Importer le package suffit à les enregistrer.
"""

from models import (  # noqa: F401
    accident,
    accident_sync,
    badge,
    bike,
    commune_lighting,
    email_verification,
    geocode_cache,
    graph_profile,
    history,
    poi,
    poi_sync,
    recap,
    refresh_session,
    report,
    report_abuse,
    report_vote,
    route,
    street_lamp,
    street_lamp_sync,
    tag,
    task,
    user,
    user_block,
)
