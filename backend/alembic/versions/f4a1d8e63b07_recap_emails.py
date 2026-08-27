"""récapitulatifs périodiques par e-mail

Revision ID: f4a1d8e63b07
Revises: e9b4c7a25d18
Create Date: 2026-08-26 21:30:00.000000

Préférence de réception et traçabilité des envois.

`users.recap_emails` est à `true` par défaut : le récapitulatif porte sur les
trajets de la personne qui le reçoit, dans le cadre du service — ce n'est pas de
la prospection — et il se coupe en un clic depuis l'e-mail comme depuis les
réglages de l'application.

`users.recap_unsub_version` existe pour révoquer d'un coup les liens de
désabonnement déjà partis. On aurait pu réutiliser `token_version`, mais celui-ci
est incrémenté à chaque changement de mot de passe : les liens en circulation
cesseraient alors de fonctionner, précisément dans le cas banal où quelqu'un
change son mot de passe puis souhaite se désabonner.

`recap_sends` porte la contrainte d'unicité qui rend un doublon structurellement
impossible. C'est elle, et non un verrou applicatif, qui garantit qu'un
utilisateur ne reçoit qu'un récapitulatif par période — y compris si le conteneur
redémarre au milieu d'une campagne, ce qu'un déploiement Coolify peut faire à tout
moment.

`recap_settings` arrive **désactivé**. La campagne ne démarre pas parce qu'on a
poussé du code, mais parce qu'un administrateur l'a décidé, après avoir relu un
envoi de test. C'est la seule protection qui vaille contre l'envoi accidentel de
centaines d'e-mails.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a1d8e63b07'
down_revision: Union[str, None] = 'e9b4c7a25d18'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('recap_emails', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    )
    op.add_column(
        'users',
        sa.Column('recap_unsub_version', sa.Integer(), server_default='0', nullable=False),
    )

    op.create_table(
        'recap_sends',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('kind', sa.String(length=7), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=10), nullable=False),
        sa.Column('skip_reason', sa.String(length=40), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('provider_message_id', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('sent_at', sa.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'kind', 'period_start', name='uq_recap_sends_periode'),
    )
    op.create_index(op.f('ix_recap_sends_id'), 'recap_sends', ['id'])
    op.create_index('ix_recap_sends_campagne', 'recap_sends', ['kind', 'period_start', 'status'])

    op.create_table(
        'recap_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('enabled', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_recap_settings_id'), 'recap_settings', ['id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_recap_settings_id'), table_name='recap_settings')
    op.drop_table('recap_settings')
    op.drop_index('ix_recap_sends_campagne', table_name='recap_sends')
    op.drop_index(op.f('ix_recap_sends_id'), table_name='recap_sends')
    op.drop_table('recap_sends')
    op.drop_column('users', 'recap_unsub_version')
    op.drop_column('users', 'recap_emails')
