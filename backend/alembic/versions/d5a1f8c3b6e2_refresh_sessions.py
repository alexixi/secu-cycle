"""rotation des refresh tokens : table refresh_sessions

Revision ID: d5a1f8c3b6e2
Revises: c9d3e6f1b2a4
Create Date: 2026-07-18 12:00:00.000000

Crée la table des sessions de refresh. Chaque connexion ouvre une session
(famille de refresh tokens) ; chaque refresh fait tourner le jeton (`jti`). Le
rejeu d'un jeton périmé, hors fenêtre de grâce, révoque la session (détection de
vol). Le suivi par session préserve les connexions multi-appareils.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5a1f8c3b6e2'
down_revision: Union[str, None] = 'c9d3e6f1b2a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'refresh_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sid', sa.String(length=64), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('jti', sa.String(length=64), nullable=False),
        sa.Column('prev_jti', sa.String(length=64), nullable=True),
        sa.Column('rotated_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('expires_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_refresh_sessions_id'), 'refresh_sessions', ['id'])
    op.create_index(op.f('ix_refresh_sessions_sid'), 'refresh_sessions', ['sid'], unique=True)
    op.create_index(op.f('ix_refresh_sessions_user_id'), 'refresh_sessions', ['user_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_refresh_sessions_user_id'), table_name='refresh_sessions')
    op.drop_index(op.f('ix_refresh_sessions_sid'), table_name='refresh_sessions')
    op.drop_index(op.f('ix_refresh_sessions_id'), table_name='refresh_sessions')
    op.drop_table('refresh_sessions')
