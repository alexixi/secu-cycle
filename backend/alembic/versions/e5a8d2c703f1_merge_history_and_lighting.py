"""fusion des branches historique de trajets et éclairage public

Revision ID: e5a8d2c703f1
Revises: c4a7e91b8d35, d1f6a3b8e250

Le filtrage de l'historique (c4a7e91b8d35) et la refonte de l'éclairage public
(d1f6a3b8e250, via les lampadaires) ont été écrits en parallèle sur deux
branches, toutes deux issues de b6f2d90c74a1. Alembic voit donc deux têtes et
refuse `upgrade head` (« Multiple head revisions are present »).

Cette révision les réunit sans toucher au schéma : elle n'ajoute que le point de
jonction manquant. Les deux branches portent sur des tables distinctes
(`routes`/`history` d'un côté, `street_lamps` et `graph_profiles` de l'autre),
leur ordre d'application est donc indifférent.
"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = 'e5a8d2c703f1'
down_revision: Union[str, Sequence[str], None] = ('c4a7e91b8d35', 'd1f6a3b8e250')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
