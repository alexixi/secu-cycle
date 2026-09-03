"""Formulaire de contact public : relaie un message vers la boîte de l'équipe."""

import logging
import os

from fastapi import APIRouter, Depends, HTTPException, Request

import mailer
from i18n import get_locale, t
from limiter import limiter
from mailer.templates import contact_email
from schemas.contact import ContactMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact"])

DEFAULT_CONTACT_EMAIL = "contact@secu-cycle.fr"


@router.post("/")
@limiter.limit("3/hour")
def send_contact_message(request: Request, data: ContactMessage, locale: str = Depends(get_locale)):
    """Envoie le message à l'équipe, avec l'adresse du visiteur en `reply_to`."""
    subject, html, text = contact_email(
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        email=data.email,
        subject=data.subject.strip(),
        message=data.message.strip(),
    )
    # `or` plutôt qu'un défaut de getenv : docker-compose injecte la variable vide
    # quand elle n'est pas renseignée.
    recipient = os.getenv("CONTACT_EMAIL") or DEFAULT_CONTACT_EMAIL

    try:
        mailer.send_email(recipient, subject, html, text, reply_to=data.email)
    except Exception:
        logger.exception("Échec de l'envoi du message de contact de %s", data.email)
        raise HTTPException(
            status_code=502,
            detail=t("error.contact.send_failed", locale),
        )

    return {"detail": t("message.contact_sent", locale)}
