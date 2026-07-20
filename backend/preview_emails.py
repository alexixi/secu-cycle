"""Génère une page HTML regroupant tous les gabarits d'e-mails, pour relecture.

    make mail            (depuis la racine du dépôt)
    python3 preview_emails.py [dossier_de_sortie]

Aucune dépendance ni base de données : `mailer.templates` n'importe que
`html.escape`. Le rendu obtenu est celui d'un navigateur, plus permissif que
les clients de messagerie — Outlook ignore par exemple les coins arrondis.
Seul un envoi réel valide définitivement le rendu.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from mailer import templates as t  # noqa: E402

CASES = [
    ("Vérification de compte", t.verification_email("123456")),
    ("Réinitialisation de mot de passe", t.password_reset_email("123456")),
    ("Changement d'e-mail — code (nouvelle adresse)",
     t.email_change_code_email("123456", "nouvelle@exemple.fr")),
    ("Changement d'e-mail — alerte (ancienne adresse)",
     t.email_change_alert_email("nouvelle@exemple.fr")),
    ("Formulaire de contact", t.contact_email(
        "Jean", "Dupont", "jean.dupont@exemple.fr", "Question sur un itinéraire",
        "Bonjour,\n\nJ'ai une question à propos d'un trajet.\n\nMerci !",
    )),
]


def build_page() -> str:
    sections = []
    for name, (subject, html, text) in CASES:
        sections.append(f"""
<section style="margin-bottom: 48px;">
  <h2 style="font: bold 16px/1.4 system-ui, sans-serif; margin: 0 0 4px;">{name}</h2>
  <p style="font: 13px/1.4 system-ui, sans-serif; color: #555; margin: 0 0 12px;">
    <strong>Objet :</strong> {subject}
  </p>
  <div style="border: 1px dashed #bbb;">{html}</div>
  <details style="margin-top: 8px; font: 13px/1.5 system-ui, sans-serif;">
    <summary style="cursor: pointer;">Version texte brut (repli sans HTML)</summary>
    <pre style="background: #f5f5f5; padding: 12px; white-space: pre-wrap;">{text}</pre>
  </details>
</section>""")

    return f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Prévisualisation des e-mails Sécu'Cycle</title></head>
<body style="margin: 0; padding: 24px; background: #fff;">
<h1 style="font: bold 20px/1.4 system-ui, sans-serif;">Gabarits d'e-mails Sécu'Cycle</h1>
<p style="font: 13px/1.5 system-ui, sans-serif; color: #555; max-width: 62ch;">
  Rendu dans un navigateur, plus permissif que les clients de messagerie
  (Outlook ignore notamment les coins arrondis). Le logo est chargé depuis
  <code>{t.LOGO_URL}</code> : coupez les images du navigateur pour simuler un
  client qui les bloque — tout doit rester lisible.
</p>
{"".join(sections)}
</body></html>"""


def main() -> None:
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else BACKEND_DIR / ".mail-preview"
    out_dir.mkdir(parents=True, exist_ok=True)

    target = out_dir / "emails.html"
    target.write_text(build_page(), encoding="utf-8")
    print(f"📧 {len(CASES)} gabarits écrits dans {target}")


if __name__ == "__main__":
    main()
