"""Transport bas niveau pour l'envoi d'e-mails via Resend."""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


class MailerError(Exception):
    """Échec d'envoi, porteur du corps de la réponse.

    `raise_for_status()` produit une exception dont le message ne contient que le
    code HTTP — or c'est le corps qui dit *pourquoi* Resend a refusé (« invalid
    `to` field », domaine non vérifié, quota atteint). Sans cette classe, la
    colonne `recap_sends.error` ne contiendrait qu'un « 422 » inexploitable.
    """

    def __init__(self, status_code: int, body: str):
        self.status_code = status_code
        self.body = body
        super().__init__(f"Resend a répondu {status_code} : {body[:500]}")


def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    text: str | None = None,
    from_addr: str | None = None,
    reply_to: str | None = None,
    headers: dict | None = None,
) -> str | None:
    """Envoie un e-mail via Resend.

    :param to: destinataire(s).
    :param subject: sujet de l'e-mail.
    :param html: corps HTML.
    :param text: corps texte brut (fallback), optionnel.
    :param from_addr: expéditeur. Par défaut `RESEND_FROM_EMAIL`.
    :param reply_to: adresse de réponse, optionnel.
    :param headers: en-têtes du message, par exemple `List-Unsubscribe`.
    :returns: l'identifiant du message chez Resend, ou `None` si aucune clé n'est
        configurée. Cet identifiant est le seul moyen de retrouver un message
        précis dans leur tableau de bord ; un appelant qui trace ses envois doit
        le conserver, et traiter le `None` comme « rien n'est parti » plutôt que
        comme un succès.
    :raises MailerError: si Resend rejette l'envoi.
    :raises httpx.HTTPError: en cas d'échec réseau.
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
        return None

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
    if headers:
        payload["headers"] = headers

    with httpx.Client(timeout=30) as client:
        resp = client.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )
        if resp.status_code >= 400:
            raise MailerError(resp.status_code, resp.text)
        try:
            return resp.json().get("id")
        except ValueError:
            # Réponse acceptée mais illisible : l'e-mail est parti, on ne sait
            # simplement pas sous quel identifiant. Ne pas transformer ça en échec.
            return ""
