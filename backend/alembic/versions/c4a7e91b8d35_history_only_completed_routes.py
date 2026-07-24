"""purge history entries of routes never ridden with guidance

Revision ID: c4a7e91b8d35
Revises: b6f2d90c74a1
Create Date: 2026-07-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c4a7e91b8d35'
down_revision: Union[str, None] = 'b6f2d90c74a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # L'historique était alimenté au calcul d'itinéraire : chaque recherche y
    # ajoutait les 2-3 variantes proposées, même sans guidage. On ne garde que
    # les trajets réellement terminés (completed_at posé par /routes/{id}/complete).
    op.execute("""
        DELETE FROM user_history
        WHERE route_id IN (SELECT id FROM routes WHERE completed_at IS NULL)
    """)


def downgrade() -> None:
    # Purge de données : rien à restaurer.
    pass
