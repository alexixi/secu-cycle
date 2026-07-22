"""add road accidents and their sync tables

Revision ID: b6f2d90c74a1
Revises: a1c4e8b7f302
Create Date: 2026-07-21 18:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6f2d90c74a1'
down_revision: Union[str, None] = 'a1c4e8b7f302'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('road_accidents',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('source', sa.String(length=20), nullable=False),
    sa.Column('source_ref', sa.String(length=64), nullable=False),
    sa.Column('country', sa.String(length=2), nullable=False),
    sa.Column('latitude', sa.Float(), nullable=False),
    sa.Column('longitude', sa.Float(), nullable=False),
    sa.Column('occurred_on', sa.Date(), nullable=True),
    sa.Column('severity', sa.Integer(), server_default='1', nullable=False),
    sa.Column('involves_bicycle', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('properties', sa.JSON(), nullable=True),
    sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('source', 'source_ref', name='uq_road_accidents_source_ref')
    )
    op.create_index(op.f('ix_road_accidents_id'), 'road_accidents', ['id'], unique=False)
    op.create_index('ix_road_accidents_lat_lon', 'road_accidents', ['latitude', 'longitude'], unique=False)
    op.create_index('ix_road_accidents_occurred_on', 'road_accidents', ['occurred_on'], unique=False)

    op.create_table('accident_sync_runs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('trigger', sa.String(length=10), nullable=False),
    sa.Column('status', sa.String(length=10), nullable=False),
    sa.Column('started_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
    sa.Column('finished_at', sa.TIMESTAMP(), nullable=True),
    sa.Column('total_accidents', sa.Integer(), nullable=True),
    sa.Column('created_accidents', sa.Integer(), nullable=True),
    sa.Column('deleted_accidents', sa.Integer(), nullable=True),
    sa.Column('error', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accident_sync_runs_id'), 'accident_sync_runs', ['id'], unique=False)
    op.create_index('ix_accident_sync_runs_started_at', 'accident_sync_runs', ['started_at'], unique=False)

    op.create_table('accident_sync_settings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('interval_days', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accident_sync_settings_id'), 'accident_sync_settings', ['id'], unique=False)

    # Ligne unique de réglages (cf. SETTINGS_ID). interval_days NULL = synchro
    # automatique désactivée : les bases d'accidentologie ne sont republiées
    # qu'une fois l'an, un rafraîchissement imposé n'aurait aucun intérêt.
    op.execute("INSERT INTO accident_sync_settings (id, interval_days) VALUES (1, NULL)")


def downgrade() -> None:
    op.drop_index(op.f('ix_accident_sync_settings_id'), table_name='accident_sync_settings')
    op.drop_table('accident_sync_settings')
    op.drop_index('ix_accident_sync_runs_started_at', table_name='accident_sync_runs')
    op.drop_index(op.f('ix_accident_sync_runs_id'), table_name='accident_sync_runs')
    op.drop_table('accident_sync_runs')
    op.drop_index('ix_road_accidents_occurred_on', table_name='road_accidents')
    op.drop_index('ix_road_accidents_lat_lon', table_name='road_accidents')
    op.drop_index(op.f('ix_road_accidents_id'), table_name='road_accidents')
    op.drop_table('road_accidents')
