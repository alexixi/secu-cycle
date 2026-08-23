"""add data scope flag to graph profiles

Revision ID: b2e7d4f9c518
Revises: a8c4e2d70b19
Create Date: 2026-08-21 15:00:00.000000

Le graphe de routage doit tenir en RAM ; les données cartographiques (POI,
accidents, éclairage) vivent en base et n'ont pas cette contrainte. Les deux
emprises étaient pourtant confondues : les synchros suivaient le profil de
graphe actif et purgeaient tout ce qui en sortait, si bien que restreindre le
graphe pour tenir sur le serveur vidait les cartes des villes retirées.

Ce drapeau désigne le profil dont les communes délimitent les synchros. Il est
posé sur le profil de graphe actif, de sorte que l'état après migration est
identique à l'état avant.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2e7d4f9c518'
down_revision: Union[str, None] = 'a8c4e2d70b19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'graph_profiles',
        sa.Column('is_data_scope', sa.Boolean(), nullable=False,
                  server_default=sa.false()),
    )
    op.execute("UPDATE graph_profiles SET is_data_scope = true WHERE is_default")


def downgrade() -> None:
    op.drop_column('graph_profiles', 'is_data_scope')
