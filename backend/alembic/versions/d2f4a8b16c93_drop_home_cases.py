"""suppression de la table home_cases (cases de la page d'accueil)

Revision ID: d2f4a8b16c93
Revises: c6a2b91d47e8
Create Date: 2026-08-26 10:00:00.000000

Les quatre cases de la page d'accueil sont remontées en dur dans le catalogue du
site (`frontend-web/src/i18n/locales/{fr,en}/home.json`). Le passage par la base
n'apportait rien — leur texte ne bouge quasiment jamais — et coûtait deux choses :
il interdisait d'y placer des liens, le contenu étant rendu comme texte échappé, et
il aurait fallu des colonnes `title_en` / `text_en` pour les traduire.

S'y ajoutait une divergence silencieuse : le pré-rendu react-snap ne joint pas
l'API, donc les moteurs indexaient déjà le littéral du front pendant que le
visiteur voyait, lui, le contenu de la base — lequel avait pris du retard.

Le `downgrade` recrée la table vide. Le contenu n'est pas récupérable et n'a pas
à l'être : il vit désormais dans le code, sous revue de version.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2f4a8b16c93'
down_revision: Union[str, None] = 'c6a2b91d47e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(op.f('ix_home_cases_id'), table_name='home_cases')
    op.drop_table('home_cases')


def downgrade() -> None:
    # Forme reprise à l'identique de la baseline 2f7a651e33b3 : un
    # upgrade/downgrade/upgrade doit reconverger, sinon `alembic check` diverge.
    op.create_table('home_cases',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('text', sa.Text(), nullable=False),
    sa.Column('position', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_home_cases_id'), 'home_cases', ['id'], unique=False)
