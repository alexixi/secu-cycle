"""compteur d'essais sur les codes e-mail (anti-brute-force)

Revision ID: b8e4f2c1a9d7
Revises: e7b2c9f4a015
Create Date: 2026-07-18 10:00:00.000000

Ajoute la colonne `attempts` sur `email_verifications`. Chaque essai
infructueux d'un code (vérification de compte ou réinitialisation de mot de
passe) incrémente ce compteur ; au-delà du seuil défini côté application, le
code est verrouillé. Cela empêche le brute-force d'un code à 6 chiffres, dont
le seul frein était jusqu'ici un rate limit par IP (contournable en
distribuant les requêtes).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8e4f2c1a9d7'
down_revision: Union[str, None] = 'e7b2c9f4a015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'email_verifications',
        sa.Column('attempts', sa.Integer(), server_default='0', nullable=False),
    )


def downgrade() -> None:
    op.drop_column('email_verifications', 'attempts')
