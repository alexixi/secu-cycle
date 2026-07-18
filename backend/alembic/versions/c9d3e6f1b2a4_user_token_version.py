"""révocation des jetons via token_version

Revision ID: c9d3e6f1b2a4
Revises: b8e4f2c1a9d7
Create Date: 2026-07-18 11:00:00.000000

Ajoute la colonne `token_version` sur `users` (défaut 0). Elle est embarquée
dans les JWT (claim « tv ») et vérifiée à chaque requête authentifiée. En
l'incrémentant (réinitialisation de mot de passe, bannissement), on invalide
d'un coup tous les jetons émis auparavant — ce qui manquait jusqu'ici (un
refresh volé restait utilisable 30 jours malgré un changement de mot de passe).

Les jetons déjà émis, dépourvus du claim « tv », sont interprétés comme
version 0 côté application : le déploiement ne déconnecte donc personne.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9d3e6f1b2a4'
down_revision: Union[str, None] = 'b8e4f2c1a9d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('token_version', sa.Integer(), server_default='0', nullable=False),
    )


def downgrade() -> None:
    op.drop_column('users', 'token_version')
