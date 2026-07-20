"""Gabarits d'e-mails.

Un builder par type d'e-mail, renvoyant le triplet `(subject, html, text)`
consommé par `mailer.send_email`. Ajouter un nouveau type de mail = ajouter
une fonction ici, sans toucher au transport.

Le HTML reste volontairement rudimentaire (styles en ligne, pas de feuille
externe, pas de flexbox) : les clients de messagerie ne supportent pas grand
chose de façon fiable.
"""

from html import escape

BRAND = "#0078bc"
BRAND_DARK = "#1e2030"
BRAND_BG = "#e7ecfb"
TEXT_MUTED = "#4c4c4c"
BORDER = "#e2e8f0"

LOGO_URL = "https://secu-cycle.fr/pwa-192.png"
SITE_NAME = "Sécu'Cycle"


def _shell(heading: str, body: str) -> str:
    """Enveloppe commune : bandeau avec logo, contenu, pied de page.

    Les images sont fréquemment bloquées par défaut : le logo porte donc un
    `alt` explicite et aucune information essentielle n'y est confiée.
    """
    return f"""\
<div style="margin: 0; padding: 24px 12px; background-color: {BRAND_BG};">
  <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff;
              border: 1px solid {BORDER}; border-radius: 12px; overflow: hidden;
              font-family: Arial, Helvetica, sans-serif; color: {BRAND_DARK};">

    <div style="padding: 24px 24px 0; text-align: center;">
      <img src="{LOGO_URL}" width="64" height="64" alt="{SITE_NAME}"
           style="display: block; margin: 0 auto; width: 64px; height: 64px;
                  border: 0; border-radius: 12px;">
      <div style="margin-top: 10px; font-size: 18px; font-weight: bold;
                  color: {BRAND};">{SITE_NAME}</div>
    </div>

    <div style="padding: 8px 24px 24px;">
      <h2 style="margin: 16px 0 12px; font-size: 20px; color: {BRAND_DARK};">{heading}</h2>
      {body}
    </div>

    <div style="padding: 16px 24px; border-top: 1px solid {BORDER};
                background-color: #fafbff; font-size: 12px; color: {TEXT_MUTED};
                text-align: center;">
      {SITE_NAME} — itinéraires vélo sécurisés
    </div>
  </div>
</div>"""


def _code_block(code: str) -> str:
    """Bloc mettant en avant un code à usage unique."""
    return f"""\
      <div style="margin: 24px 0; padding: 16px; text-align: center;
                  background-color: {BRAND_BG}; border-radius: 10px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px;
                     color: {BRAND};">{code}</span>
      </div>"""


def verification_email(code: str) -> tuple[str, str, str]:
    """E-mail de validation de compte contenant le code à 6 chiffres."""
    subject = "Votre code de vérification Sécu'Cycle"

    html = _shell(
        "Bienvenue sur Sécu'Cycle&nbsp;!",
        f"""\
      <p style="margin: 0; font-size: 15px; line-height: 22px;">Pour activer votre compte,
         saisissez le code de vérification suivant&nbsp;:</p>
{_code_block(code)}
      <p style="margin: 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         Ce code est valable 15&nbsp;minutes. Si vous n'êtes pas à l'origine de cette
         demande, ignorez cet e-mail.</p>""",
    )

    text = (
        "Bienvenue sur Sécu'Cycle !\n\n"
        f"Votre code de vérification est : {code}\n\n"
        "Ce code est valable 15 minutes. "
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail."
    )

    return subject, html, text


def password_reset_email(code: str) -> tuple[str, str, str]:
    """E-mail de réinitialisation de mot de passe contenant le code à 6 chiffres."""
    subject = "Réinitialisation de votre mot de passe Sécu'Cycle"

    html = _shell(
        "Réinitialisation de mot de passe",
        f"""\
      <p style="margin: 0; font-size: 15px; line-height: 22px;">Vous avez demandé à
         réinitialiser votre mot de passe. Saisissez le code suivant pour en choisir
         un nouveau&nbsp;:</p>
{_code_block(code)}
      <p style="margin: 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         Ce code est valable 15&nbsp;minutes. Si vous n'êtes pas à l'origine de cette
         demande, ignorez cet e-mail&nbsp;: votre mot de passe reste inchangé.</p>""",
    )

    text = (
        "Réinitialisation de votre mot de passe Sécu'Cycle\n\n"
        f"Votre code de réinitialisation est : {code}\n\n"
        "Ce code est valable 15 minutes. "
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : "
        "votre mot de passe reste inchangé."
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

    html = _shell(
        "Nouveau message depuis le formulaire de contact",
        f"""\
      <p style="margin: 0; font-size: 14px; line-height: 21px; color: {TEXT_MUTED};">
        <strong>De&nbsp;:</strong> {escape(sender)}
        &lt;<a href="mailto:{escape(email, quote=True)}"
              style="color: {BRAND};">{escape(email)}</a>&gt;<br>
        <strong>Sujet&nbsp;:</strong> {escape(subject)}
      </p>
      <div style="white-space: pre-wrap; background-color: {BRAND_BG};
                  border-left: 4px solid {BRAND}; border-radius: 8px; padding: 16px;
                  margin-top: 16px; font-size: 14px; line-height: 21px;
                  ">{escape(message)}</div>""",
    )

    text = (
        "Nouveau message depuis le formulaire de contact\n\n"
        f"De : {sender} <{email}>\n"
        f"Sujet : {subject}\n\n"
        f"{message}"
    )

    return mail_subject, html, text
