"""adresse cible des demandes de changement d'e-mail

Revision ID: f2c7b1e5d904
Revises: d5a1f8c3b6e2
Create Date: 2026-07-20 10:00:00.000000

Ajoute la colonne `target_email` sur `email_verifications`. Le changement
d'adresse se déroule en deux temps : l'utilisateur demande le changement, puis
le confirme avec le code reçu sur la nouvelle adresse. L'adresse visée doit
donc survivre entre les deux requêtes.

Elle est stockée côté serveur, et non refournie par le client au moment de la
confirmation : sinon un code obtenu légitimement pour une adresse que l'on
contrôle pourrait être rejoué pour s'attribuer l'adresse d'un tiers, ce qui
contournerait entièrement la preuve de possession. Le couple (code, adresse
cible) est ainsi scellé dès l'émission.

La colonne est nullable : les lignes des flux existants (vérification de
compte, réinitialisation de mot de passe) n'ont pas d'adresse cible et restent
inchangées. Aucun backfill n'est nécessaire.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2c7b1e5d904'
down_revision: Union[str, None] = 'd5a1f8c3b6e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'email_verifications',
        sa.Column('target_email', sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('email_verifications', 'target_email')
