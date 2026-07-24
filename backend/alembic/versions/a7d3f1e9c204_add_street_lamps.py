"""add street_lamps

Revision ID: a7d3f1e9c204
Revises: b6f2d90c74a1
Create Date: 2026-07-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7d3f1e9c204'
down_revision: Union[str, None] = 'b6f2d90c74a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'street_lamps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(length=20), nullable=False),
        sa.Column('source_ref', sa.String(length=64), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('source', 'source_ref', name='uq_street_lamps_source_ref'),
    )
    op.create_index('ix_street_lamps_lat_lon', 'street_lamps', ['latitude', 'longitude'], unique=False)
    op.create_index(op.f('ix_street_lamps_id'), 'street_lamps', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_street_lamps_id'), table_name='street_lamps')
    op.drop_index('ix_street_lamps_lat_lon', table_name='street_lamps')
    op.drop_table('street_lamps')
