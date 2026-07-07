"""Gabarits d'e-mails.

Un builder par type d'e-mail, renvoyant le triplet `(subject, html, text)`
consommé par `mailer.send_email`. Ajouter un nouveau type de mail = ajouter
une fonction ici, sans toucher au transport.
"""


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
