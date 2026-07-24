"""add night extinction window to graph profiles

Revision ID: d1f6a3b8e250
Revises: c8b2e5a41f07
Create Date: 2026-07-23 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1f6a3b8e250'
down_revision: Union[str, None] = 'c8b2e5a41f07'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('graph_profiles', sa.Column('night_extinction_start', sa.Integer(), nullable=True))
    op.add_column('graph_profiles', sa.Column('night_extinction_end', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('graph_profiles', 'night_extinction_end')
    op.drop_column('graph_profiles', 'night_extinction_start')
