"""fusion des branches badges et profils de graphe

Revision ID: 7c1f0a9d4b62
Revises: 15a5aa55f3f1, b3d51c8af407
Create Date: 2026-07-11 23:35:00.000000

Les badges (b3d51c8af407) et les profils de graphe (15a5aa55f3f1, via la
synchronisation des POI) ont été écrits en parallèle sur deux branches, toutes
deux issues de e3824ec469bf. Une fois les deux fusionnées dans dev, Alembic voit
deux têtes et refuse `upgrade head` : c'est ce qui a fait échouer le déploiement.

Cette révision les réunit. Elle ne touche pas au schéma : elle ne fait qu'ajouter
le point de jonction qui manquait au graphe des migrations. Les deux branches
portent sur des tables distinctes, leur ordre d'application est donc indifférent.
"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = '7c1f0a9d4b62'
down_revision: Union[str, Sequence[str], None] = ('15a5aa55f3f1', 'b3d51c8af407')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
