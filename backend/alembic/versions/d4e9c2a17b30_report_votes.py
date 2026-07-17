"""table report_votes (votes là/pas là)

Revision ID: d4e9c2a17b30
Revises: c3f81a6b4d29
Create Date: 2026-07-16 12:00:00.000000

Ajoute la table `report_votes` : chaque utilisateur peut confirmer (« Là ») ou
infirmer (« Pas là ») un signalement, avec un seul vote par (signalement, user)
garanti par une contrainte unique. Les compteurs et le statut (expiré / désactivé)
ne sont pas stockés : ils sont recalculés à la lecture à partir des votes encore
valides (cf. `reports_lifecycle.py`). Aucune colonne n'est ajoutée à `reports`.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e9c2a17b30'
down_revision: Union[str, None] = 'c3f81a6b4d29'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'report_votes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('is_present', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['report_id'], ['reports.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('report_id', 'user_id', name='uq_report_votes_report_user'),
    )
    op.create_index(op.f('ix_report_votes_id'), 'report_votes', ['id'], unique=False)
    op.create_index(op.f('ix_report_votes_report_id'), 'report_votes', ['report_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_report_votes_report_id'), table_name='report_votes')
    op.drop_index(op.f('ix_report_votes_id'), table_name='report_votes')
    op.drop_table('report_votes')
