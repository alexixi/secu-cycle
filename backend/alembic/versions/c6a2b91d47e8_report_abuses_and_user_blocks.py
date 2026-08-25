"""tables report_abuses et user_blocks (modération du contenu utilisateur)

Revision ID: c6a2b91d47e8
Revises: b2e7d4f9c518
Create Date: 2026-08-24 12:00:00.000000

Les stores exigent, pour toute application affichant du contenu écrit par ses
utilisateurs, un moyen de dénoncer un contenu répréhensible et de bloquer son
auteur. Nos signalements portent une description en texte libre affichée
publiquement : les deux mécanismes s'imposent.

`report_abuses` est distincte de `report_votes` : « Pas là » juge l'exactitude
d'un signalement, une dénonciation juge sa décence. Comme pour les votes, rien
n'est stocké sur `reports` — le masquage se recalcule à la lecture à partir du
nombre de dénonciations.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6a2b91d47e8'
down_revision: Union[str, None] = 'b2e7d4f9c518'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'report_abuses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=20), server_default='other', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['report_id'], ['reports.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('report_id', 'user_id', name='uq_report_abuses_report_user'),
    )
    op.create_index(op.f('ix_report_abuses_id'), 'report_abuses', ['id'], unique=False)
    op.create_index(op.f('ix_report_abuses_report_id'), 'report_abuses', ['report_id'], unique=False)

    op.create_table(
        'user_blocks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('blocker_id', sa.Integer(), nullable=False),
        sa.Column('blocked_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['blocker_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['blocked_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('blocker_id', 'blocked_id', name='uq_user_blocks_pair'),
        sa.CheckConstraint('blocker_id <> blocked_id', name='ck_user_blocks_not_self'),
    )
    op.create_index(op.f('ix_user_blocks_id'), 'user_blocks', ['id'], unique=False)
    op.create_index(op.f('ix_user_blocks_blocker_id'), 'user_blocks', ['blocker_id'], unique=False)
    op.create_index(op.f('ix_user_blocks_blocked_id'), 'user_blocks', ['blocked_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_blocks_blocked_id'), table_name='user_blocks')
    op.drop_index(op.f('ix_user_blocks_blocker_id'), table_name='user_blocks')
    op.drop_index(op.f('ix_user_blocks_id'), table_name='user_blocks')
    op.drop_table('user_blocks')

    op.drop_index(op.f('ix_report_abuses_report_id'), table_name='report_abuses')
    op.drop_index(op.f('ix_report_abuses_id'), table_name='report_abuses')
    op.drop_table('report_abuses')
