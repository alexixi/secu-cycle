"""cache de géocodage et compteur d'appels providers

Revision ID: a1c4e8b7f302
Revises: f2c7b1e5d904
Create Date: 2026-07-20 12:00:00.000000

Le géocodage passe désormais par l'API plutôt que par des appels directs des
clients à la BAN, pour servir la Belgique en plus de la France. Deux tables
l'accompagnent.

`geocode_cache` mémorise les réponses servies. L'autocomplétion émet une requête
par préfixe frappé et ces préfixes sont très largement partagés d'un utilisateur
à l'autre : sans cache, chaque recherche de lieu coûterait plusieurs appels
MapTiler. La clé inclut le profil de graphe, puisque c'est lui qui définit
l'emprise sur laquelle les résultats sont filtrés.

`geocode_usage` compte les appels facturés par mois. Le quota MapTiler est
partagé avec les tuiles de la carte : l'épuiser couperait la carte elle-même. Le
compteur permet de dégrader en « BAN seule » avant d'en arriver là.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1c4e8b7f302'
down_revision: Union[str, None] = 'f2c7b1e5d904'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'geocode_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('kind', sa.String(length=16), nullable=False),
        sa.Column('query', sa.String(length=255), nullable=False),
        sa.Column('profile', sa.String(length=64), nullable=False),
        sa.Column('results', sa.JSON(), nullable=False),
        sa.Column('fetched_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('kind', 'query', 'profile', name='uq_geocode_cache_key'),
    )
    op.create_index(op.f('ix_geocode_cache_id'), 'geocode_cache', ['id'])
    op.create_index('ix_geocode_cache_fetched_at', 'geocode_cache', ['fetched_at'])

    op.create_table(
        'geocode_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(length=32), nullable=False),
        sa.Column('period', sa.String(length=7), nullable=False),
        sa.Column('calls', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider', 'period', name='uq_geocode_usage_period'),
    )
    op.create_index(op.f('ix_geocode_usage_id'), 'geocode_usage', ['id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_geocode_usage_id'), table_name='geocode_usage')
    op.drop_table('geocode_usage')
    op.drop_index('ix_geocode_cache_fetched_at', table_name='geocode_cache')
    op.drop_index(op.f('ix_geocode_cache_id'), table_name='geocode_cache')
    op.drop_table('geocode_cache')
