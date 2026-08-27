"""dénivelé des trajets

Revision ID: e9b4c7a25d18
Revises: d2f4a8b16c93
Create Date: 2026-08-26 21:00:00.000000

Persiste le dénivelé des trajets, jusqu'ici calculé puis jeté.

`graph.routing` produit déjà `height_difference` à chaque calcul d'itinéraire, le
renvoie au client… et rien ne le garde. Impossible, dès lors, de dire à un
cycliste combien il a grimpé le mois dernier. Les deux colonnes sont renseignées
à la création de la ligne, comme `was_rainy` : c'est le seul instant où le graphe
et ses altitudes IGN sont sous la main.

Elles sont **nullables** à dessein. `NULL` veut dire « non mesuré », `0` veut dire
« plat » : confondre les deux ferait afficher un dénivelé nul là où l'on n'en sait
simplement rien.

Reprise de l'historique
-----------------------
Contrairement à `was_rainy` — où la météo passée était définitivement perdue — la
donnée est ici reconstituable : `routes.path` stocke `[lat, lon, altitude]` pour
chaque point du tracé. On la reconstitue donc, plutôt que de laisser un trou d'un
an dans les premiers récapitulatifs.

Avec une précaution, car `extract_route_geometry` répète l'altitude du nœud amont
pour *chaque* point de la géométrie d'une arête : `path` est un escalier dont les
paliers suivent la densité du tracé OSM, pas le relief. Le lisser tel quel n'aurait
aucun sens. `altitudes_depuis_path` réduit chaque palier à un point, ce qui
restitue la séquence par nœud sur laquelle le calcul a été conçu. Deux nœuds
voisins d'altitude rigoureusement identique y fusionnent : la séquence raccourcit,
le lissage porte un peu plus loin, et le dénivelé est très légèrement sous-estimé.
On préfère cette erreur-là à son inverse.

Seuls les trajets **terminés** sont repris. Un calcul d'itinéraire insère 2 à 3
variantes dont l'utilisateur n'en parcourt au plus qu'une : les autres n'entrent
dans aucun récapitulatif, et les reprendre ferait travailler la migration trois
fois plus longtemps pour rien — or elle s'exécute au démarrage du conteneur, avant
que l'API ne réponde.

L'index, lui, est un gain indépendant de tout cela : `routes` n'avait aucun index
sur `user_id`, si bien que les quatre compteurs de badges parcouraient la table
entière à chaque `GET /badges/` et à chaque trajet terminé.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9b4c7a25d18'
down_revision: Union[str, None] = 'd2f4a8b16c93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Les lignes sont relues par paquets : un `path` porte des milliers de points, et
# tout charger d'un coup ferait grimper la mémoire du conteneur au démarrage.
TAILLE_LOT = 500


def upgrade() -> None:
    op.add_column('routes', sa.Column('elevation_gain_m', sa.Float(), nullable=True))
    op.add_column('routes', sa.Column('elevation_loss_m', sa.Float(), nullable=True))

    op.create_index(
        'ix_routes_user_completed',
        'routes',
        ['user_id', 'completed_at'],
        postgresql_where=sa.text('completed_at IS NOT NULL'),
    )

    _reprendre_historique()


def _reprendre_historique() -> None:
    """Renseigne le dénivelé des trajets déjà terminés, à partir de leur tracé."""
    # Import tardif : `graph.elevation_profile` n'a aucune dépendance, mais on ne
    # veut pas qu'un échec d'import empêche l'ajout des colonnes elles-mêmes.
    from graph.elevation_profile import altitudes_depuis_path, gain_perte

    connexion = op.get_bind()
    dernier_id = 0
    traites = 0
    renseignes = 0

    while True:
        lignes = connexion.execute(
            sa.text("""
                SELECT id, path FROM routes
                WHERE id > :dernier
                  AND completed_at IS NOT NULL
                  AND path IS NOT NULL
                ORDER BY id
                LIMIT :lot
            """),
            {"dernier": dernier_id, "lot": TAILLE_LOT},
        ).fetchall()

        if not lignes:
            break

        for ligne in lignes:
            dernier_id = ligne.id
            traites += 1

            altitudes = altitudes_depuis_path(ligne.path)
            if len(altitudes) < 2:
                # Tracé sans altitude exploitable : la colonne reste NULL, ce qui
                # est l'exacte vérité — on ne sait pas.
                continue

            gain, perte = gain_perte(altitudes)
            connexion.execute(
                sa.text("""
                    UPDATE routes
                    SET elevation_gain_m = :gain, elevation_loss_m = :perte
                    WHERE id = :id
                """),
                {"gain": gain, "perte": perte, "id": ligne.id},
            )
            renseignes += 1

    if traites:
        print(
            f"[migration e9b4c7a25d18] dénivelé repris : "
            f"{renseignes}/{traites} trajet(s) terminé(s).",
            flush=True,
        )


def downgrade() -> None:
    op.drop_index('ix_routes_user_completed', table_name='routes')
    op.drop_column('routes', 'elevation_loss_m')
    op.drop_column('routes', 'elevation_gain_m')
