"""langue des e-mails sur le profil utilisateur

Revision ID: a5c1e0d73f28
Revises: b7d2f5a91c46
Create Date: 2026-08-28 11:40:00.000000

La langue des *réponses* de l'API est négociée par requête (`?lang=` puis
`Accept-Language`) et n'a besoin d'aucune colonne. Les e-mails, eux, n'ont pas
toujours de requête d'où la tirer : le récapitulatif périodique part d'une
boucle de fond, sans client au bout du fil. C'est la seule raison d'être de
cette colonne, et elle ne fait autorité que là.

`server_default='fr'` plutôt qu'un backfill : les comptes existants gardent la
langue dans laquelle ils recevaient déjà leurs e-mails, et la colonne peut être
`NOT NULL` dès la migration. Les clients corrigent ensuite la préférence de
ceux qui ont réglé l'application en anglais, à leur premier démarrage.

Deux caractères : les langues servies sont `fr` et `en` (`i18n.SUPPORTED`), sans
variante régionale. La validation vit dans `schemas/user.py` — une contrainte de
base rendrait l'ajout d'une troisième langue plus coûteux qu'il ne doit l'être.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5c1e0d73f28'
down_revision: Union[str, None] = 'b7d2f5a91c46'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('language', sa.String(length=2), server_default='fr', nullable=False),
    )


def downgrade() -> None:
    op.drop_column('users', 'language')
