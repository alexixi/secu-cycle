"""signalement vérifié (toujours actif)

Revision ID: e7b2c9f4a015
Revises: d4e9c2a17b30
Create Date: 2026-07-16 13:00:00.000000

Ajoute la colonne `is_verified` sur `reports` : un admin peut marquer un
signalement comme vérifié (ex. chantier officiel signalé par la ville). Un
signalement vérifié reste actif quels que soient les votes et l'expiration,
jusqu'à ce qu'un admin le décoche ou le supprime.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7b2c9f4a015'
down_revision: Union[str, None] = 'd4e9c2a17b30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'reports',
        sa.Column('is_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    )


def downgrade() -> None:
    op.drop_column('reports', 'is_verified')
