"""add street_lamp sync runs and settings

Revision ID: c8b2e5a41f07
Revises: a7d3f1e9c204
Create Date: 2026-07-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8b2e5a41f07'
down_revision: Union[str, None] = 'a7d3f1e9c204'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'street_lamp_sync_runs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trigger', sa.String(length=10), nullable=False),
        sa.Column('status', sa.String(length=10), nullable=False),
        sa.Column('started_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('finished_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('total_lamps', sa.Integer(), nullable=True),
        sa.Column('created_lamps', sa.Integer(), nullable=True),
        sa.Column('deleted_lamps', sa.Integer(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_street_lamp_sync_runs_started_at', 'street_lamp_sync_runs', ['started_at'], unique=False)
    op.create_index(op.f('ix_street_lamp_sync_runs_id'), 'street_lamp_sync_runs', ['id'], unique=False)

    op.create_table(
        'street_lamp_sync_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('interval_days', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_street_lamp_sync_settings_id'), 'street_lamp_sync_settings', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_street_lamp_sync_settings_id'), table_name='street_lamp_sync_settings')
    op.drop_table('street_lamp_sync_settings')
    op.drop_index(op.f('ix_street_lamp_sync_runs_id'), table_name='street_lamp_sync_runs')
    op.drop_index('ix_street_lamp_sync_runs_started_at', table_name='street_lamp_sync_runs')
    op.drop_table('street_lamp_sync_runs')
