"""trajet effectué sous la pluie

Revision ID: a8c4e2d70b19
Revises: f3b6c8d19a45
Create Date: 2026-07-30 16:00:00.000000

Ajoute la colonne `was_rainy` sur `routes` : le temps qu'il faisait au départ,
figé au moment du calcul. Elle alimente le badge « Rouleur sous la pluie ».

Renseignée à la création de la ligne et non à l'arrivée : c'est au moment du
calcul qu'on dispose des conditions du point de départ (`weather.conditions_at`),
et c'est aussi le seul instant qui a du sens — le mérite est d'être parti sous
l'averse, pas d'être arrivé après elle.

Historique : les trajets antérieurs restent à `false`. On ne peut pas reconstituer
la météo passée depuis l'instantané en mémoire, et rien ne justifie de faire
remonter une donnée qu'on n'a jamais mesurée.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8c4e2d70b19'
down_revision: Union[str, None] = 'f3b6c8d19a45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'routes',
        sa.Column('was_rainy', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    )


def downgrade() -> None:
    op.drop_column('routes', 'was_rainy')
