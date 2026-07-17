"""add faqs

Revision ID: c3f81a6b4d29
Revises: 7c1f0a9d4b62
Create Date: 2026-07-15 12:00:00.000000

Crée la table `faqs` alimentant la page FAQ dédiée du site public et sa gestion
depuis le dashboard admin. Même forme que `home_cases` (question/réponse
ordonnées), avec en plus un drapeau `is_published` : l'API publique ne renvoie
que les entrées publiées, l'admin voit aussi les brouillons.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3f81a6b4d29'
down_revision: Union[str, None] = '7c1f0a9d4b62'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'faqs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question', sa.String(length=255), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('is_published', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_faqs_id'), 'faqs', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_faqs_id'), table_name='faqs')
    op.drop_table('faqs')
