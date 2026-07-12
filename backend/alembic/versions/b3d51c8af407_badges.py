"""badges de réussite + trajets terminés

Revision ID: b3d51c8af407
Revises: e3824ec469bf
Create Date: 2026-07-09 10:40:00.000000

Le baseline a été autogénéré avant l'existence des modèles Badge/UserBadge : les
tables `badges` et `user_badges` n'y figurent donc pas. Elles existent en revanche
sur les bases créées par l'ancien `init_db.sql`, dans une forme réduite
(name, description, goal_value). Cette migration couvre les deux cas.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3d51c8af407'
down_revision: Union[str, None] = 'e3824ec469bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(inspector, table: str) -> set:
    return {c["name"] for c in inspector.get_columns(table)}


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    tables = set(inspector.get_table_names())

    # Un trajet n'est « terminé » qu'à l'arrivée : compute_route persiste 2 à 3
    # variantes par recherche, dont une seule est réellement parcourue.
    if "completed_at" not in _columns(inspector, "routes"):
        op.add_column("routes", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))

    if "badges" not in tables:
        op.create_table(
            "badges",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("code", sa.String(length=50), nullable=True),
            sa.Column("name", sa.String(length=100), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("criteria", sa.String(length=50), nullable=True),
            sa.Column("icon", sa.String(length=50), nullable=True),
            sa.Column("goal_value", sa.Integer(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_badges_id"), "badges", ["id"], unique=False)
        op.create_index(op.f("ix_badges_code"), "badges", ["code"], unique=True)
    else:
        # Table héritée d'init_db.sql : on complète sans toucher aux lignes existantes.
        # `code` reste nullable — un ADD COLUMN NOT NULL sans défaut échouerait sur une
        # table peuplée. En Postgres les NULL sont distincts, l'index unique les tolère.
        existing = _columns(inspector, "badges")
        for name, column in [
            ("code", sa.Column("code", sa.String(length=50), nullable=True)),
            ("criteria", sa.Column("criteria", sa.String(length=50), nullable=True)),
            ("icon", sa.Column("icon", sa.String(length=50), nullable=True)),
        ]:
            if name not in existing:
                op.add_column("badges", column)

        indexes = {i["name"] for i in inspector.get_indexes("badges")}
        if "ix_badges_code" not in indexes:
            op.create_index(op.f("ix_badges_code"), "badges", ["code"], unique=True)
        if "ix_badges_id" not in indexes:
            op.create_index(op.f("ix_badges_id"), "badges", ["id"], unique=False)

    if "user_badges" not in tables:
        op.create_table(
            "user_badges",
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("badge_id", sa.Integer(), nullable=False),
            sa.Column("obtained_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["badge_id"], ["badges.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("user_id", "badge_id"),
        )
    else:
        # init_db.sql déclarait `obtained_at TIMESTAMP` (sans fuseau) là où le modèle
        # attend un timestamptz, comme les autres horodatages du projet.
        op.alter_column(
            "user_badges", "obtained_at",
            type_=sa.DateTime(timezone=True),
            existing_type=sa.TIMESTAMP(),
            existing_nullable=True,
        )

    # Pas de backfill de completed_at : marquer les anciennes routes comme terminées
    # débloquerait faussement « 10 itinéraires » et gonflerait « 10 sécurisés », puisque
    # chaque recherche passée a laissé une variante `safe` jamais parcourue.


def downgrade() -> None:
    op.drop_table("user_badges")
    op.drop_index(op.f("ix_badges_code"), table_name="badges")
    op.drop_index(op.f("ix_badges_id"), table_name="badges")
    op.drop_table("badges")
    op.drop_column("routes", "completed_at")
