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
    faq,
    geocode_cache,
    graph_profile,
    history,
    home_case,
    poi,
    poi_sync,
    refresh_session,
    report,
    report_vote,
    route,
    street_lamp,
    street_lamp_sync,
    tag,
    task,
    user,
)
