"""Tables du récapitulatif périodique : traçabilité des envois et réglages.

`recap_sends` remplit trois fonctions à elle seule, et c'est délibéré.

**Verrou d'idempotence** — la contrainte d'unicité `(user_id, kind, period_start)`
est ce qui rend un doublon structurellement impossible. Pas un verrou applicatif,
pas un drapeau en mémoire : une contrainte, qui survit aux redémarrages Coolify,
aux plantages en milieu de campagne, et à un éventuel passage à plusieurs workers.

**File d'attente** — les destinataires restants sont ceux qui n'ont pas encore de
ligne pour la période. Il n'y a donc rien à mettre en file, rien à purger, et
aucun état à conserver entre deux redémarrages.

**Journal** — `status` et `error` gardent la trace de ce qui est parti, de ce qui
a été volontairement ignoré et de ce qui a échoué. C'est ce qui permet de
répondre à « pourquoi n'ai-je rien reçu ? » autrement que par une supposition.

Le statut `unknown` mérite un mot : il désigne une ligne réservée dont on ignore
si l'e-mail est parti (serveur arrêté entre l'appel à Resend et l'enregistrement
du résultat). On ne la rejoue jamais automatiquement — sur un e-mail, un doublon
est plus grave qu'une absence.
"""

from sqlalchemy import (
    TIMESTAMP,
    Boolean,
    Column,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from database import Base

# Statuts possibles d'un envoi.
EN_COURS = "pending"
ENVOYE = "sent"
IGNORE = "skipped"
ECHOUE = "failed"
INDETERMINE = "unknown"

# Raisons d'un envoi volontairement ignoré.
SANS_ACTIVITE = "no_activity"
MAILER_DESACTIVE = "mailer_disabled"

SETTINGS_ID = 1


class RecapSend(Base):
    """Un récapitulatif, pour un utilisateur et une période."""

    __tablename__ = "recap_sends"

    id = Column(Integer, primary_key=True, index=True)
    # CASCADE : savoir qui a reçu quoi et quand est une donnée personnelle, elle
    # disparaît avec le compte.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    kind = Column(String(7), nullable=False)          # monthly | yearly
    period_start = Column(Date, nullable=False)       # 1er jour de la période COUVERTE

    status = Column(String(10), nullable=False, default=EN_COURS)
    skip_reason = Column(String(40), nullable=True)
    error = Column(Text, nullable=True)
    # Identifiant renvoyé par Resend : le seul moyen de retrouver un message
    # précis dans leur tableau de bord quand un utilisateur signale un problème.
    provider_message_id = Column(String(64), nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    sent_at = Column(TIMESTAMP, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "kind", "period_start", name="uq_recap_sends_periode"),
        Index("ix_recap_sends_campagne", "kind", "period_start", "status"),
    )


class RecapSettings(Base):
    """Réglages de la campagne. Ligne unique, sur le modèle de `PoiSyncSettings`."""

    __tablename__ = "recap_settings"

    id = Column(Integer, primary_key=True, index=True)
    # Désactivé par défaut : le code arrive en production inerte, et c'est un
    # geste d'administration — jamais un `git push` — qui déclenche le premier
    # envoi. Relu à chaque tour de boucle pour qu'une coupure prenne effet tout
    # de suite.
    enabled = Column(Boolean, nullable=False, default=False, server_default="false")
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
