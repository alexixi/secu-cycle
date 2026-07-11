"""Gabarits d'e-mails.

Un builder par type d'e-mail, renvoyant le triplet `(subject, html, text)`
consommé par `mailer.send_email`. Ajouter un nouveau type de mail = ajouter
une fonction ici, sans toucher au transport.
"""

from html import escape


def verification_email(code: str) -> tuple[str, str, str]:
    """E-mail de validation de compte contenant le code à 6 chiffres."""
    subject = "Votre code de vérification Sécu'Cycle"

    html = f"""\
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
  <h2 style="margin-bottom: 8px;">Bienvenue sur Sécu'Cycle&nbsp;!</h2>
  <p>Pour activer votre compte, saisissez le code de vérification suivant&nbsp;:</p>
  <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center;
            margin: 24px 0; color: #0a7d3f;">{code}</p>
  <p style="color: #555;">Ce code est valable 15&nbsp;minutes. Si vous n'êtes pas à l'origine
     de cette demande, ignorez cet e-mail.</p>
</div>"""

    text = (
        "Bienvenue sur Sécu'Cycle !\n\n"
        f"Votre code de vérification est : {code}\n\n"
        "Ce code est valable 15 minutes. "
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail."
    )

    return subject, html, text


def contact_email(
    first_name: str,
    last_name: str,
    email: str,
    subject: str,
    message: str,
) -> tuple[str, str, str]:
    """Message envoyé depuis le formulaire de contact, à destination de l'équipe.

    Les champs proviennent d'un visiteur non authentifié : ils sont échappés
    avant d'être injectés dans le corps HTML.
    """
    sender = f"{first_name} {last_name}"
    mail_subject = f"[Contact] {subject}"

    html = f"""\
<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1a1a1a;">
  <h2 style="margin-bottom: 8px;">Nouveau message depuis le formulaire de contact</h2>
  <p style="color: #555; margin-top: 0;">
    <strong>De&nbsp;:</strong> {escape(sender)}
    &lt;<a href="mailto:{escape(email, quote=True)}">{escape(email)}</a>&gt;<br>
    <strong>Sujet&nbsp;:</strong> {escape(subject)}
  </p>
  <div style="white-space: pre-wrap; background: #f5f5f5; border-left: 4px solid #0a7d3f;
              border-radius: 8px; padding: 16px; margin-top: 16px;">{escape(message)}</div>
</div>"""

    text = (
        "Nouveau message depuis le formulaire de contact\n\n"
        f"De : {sender} <{email}>\n"
        f"Sujet : {subject}\n\n"
        f"{message}"
    )

    return mail_subject, html, text
