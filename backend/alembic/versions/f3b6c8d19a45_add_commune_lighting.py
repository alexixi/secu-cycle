"""add commune_lighting

Revision ID: f3b6c8d19a45
Revises: e5a8d2c703f1
Create Date: 2026-07-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3b6c8d19a45'
down_revision: Union[str, None] = 'e5a8d2c703f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'commune_lighting',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('commune', sa.String(length=255), nullable=False),
        sa.Column('night_extinction_start', sa.Integer(), nullable=True),
        sa.Column('night_extinction_end', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('commune'),
    )
    op.create_index(op.f('ix_commune_lighting_id'), 'commune_lighting', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_commune_lighting_id'), table_name='commune_lighting')
    op.drop_table('commune_lighting')
