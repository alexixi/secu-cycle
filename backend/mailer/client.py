"""Transport bas niveau pour l'envoi d'e-mails via Resend."""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    text: str | None = None,
    from_addr: str | None = None,
    reply_to: str | None = None,
) -> None:
    """Envoie un e-mail via Resend.

    :param to: destinataire(s).
    :param subject: sujet de l'e-mail.
    :param html: corps HTML.
    :param text: corps texte brut (fallback), optionnel.
    :param from_addr: expéditeur. Par défaut `RESEND_FROM_EMAIL`.
    :param reply_to: adresse de réponse, optionnel.
    :raises httpx.HTTPError: si l'appel à Resend échoue (quand une clé est configurée).
    """
    api_key = os.getenv("RESEND_API_KEY")
    sender = from_addr or os.getenv("RESEND_FROM_EMAIL")
    recipients = [to] if isinstance(to, str) else to

    if not api_key:
        logger.warning(
            "RESEND_API_KEY absente : e-mail non envoyé (mode dev).\n"
            "  From:    %s\n  To:      %s\n  Subject: %s\n  Text:    %s",
            sender,
            recipients,
            subject,
            text or html,
        )
        return

    payload: dict = {
        "from": sender,
        "to": recipients,
        "subject": subject,
        "html": html,
    }
    if text is not None:
        payload["text"] = text
    if reply_to is not None:
        payload["reply_to"] = reply_to

    with httpx.Client(timeout=30) as client:
        resp = client.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )
        resp.raise_for_status()
