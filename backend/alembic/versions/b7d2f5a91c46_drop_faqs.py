"""suppression de la table faqs

Revision ID: b7d2f5a91c46
Revises: f4a1d8e63b07
Create Date: 2026-08-27 10:00:00.000000

Les neuf questions vivent désormais dans le catalogue du site
(`frontend-web/src/i18n/locales/{fr,en}/faq.json`), pour la même raison que les
cases de la page d'accueil — voir d2f4a8b16c93 — mais avec un enjeu plus net.

La page FAQ émet un JSON-LD `FAQPage`, un format de résultat enrichi. Or le
pré-rendu ne joint pas l'API : ce JSON-LD n'a jamais contenu que le littéral du
front. Une question ajoutée depuis le dashboard n'atteignait donc jamais les
moteurs, et l'édition en base donnait l'illusion du contraire. Le texte étant
maintenant dans le code, ce que Google lit est ce que le visiteur voit.

Le drapeau `is_published` disparaît avec la table : un brouillon n'a plus de sens
quand publier veut dire ouvrir une pull request.

Le `downgrade` recrée la table vide ; le contenu n'est pas récupérable et n'a pas
à l'être.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d2f5a91c46'
down_revision: Union[str, None] = 'f4a1d8e63b07'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(op.f('ix_faqs_id'), table_name='faqs')
    op.drop_table('faqs')


def downgrade() -> None:
    # Forme reprise à l'identique de c3f81a6b4d29 : un upgrade/downgrade/upgrade
    # doit reconverger, sinon `alembic check` diverge.
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
