"""Génère une page HTML regroupant tous les gabarits d'e-mails, pour relecture.

    make mail            (depuis la racine du dépôt)
    python3 preview_emails.py [dossier_de_sortie]

Aucune base de données ni variable d'environnement : `mailer.templates`
n'importe que `html.escape` et `i18n`, qui ne fait que lire deux fichiers JSON.
Le rendu obtenu est celui d'un navigateur, plus permissif que les clients de
messagerie — Outlook ignore par exemple les coins arrondis. Seul un envoi réel
valide définitivement le rendu.

Chaque gabarit est rendu dans les deux langues, l'une sous l'autre : une
traduction d'e-mail ne se relit pas autrement, et une clé manquante s'y voit
immédiatement — elle serait servie telle quelle, sans la moindre erreur.
"""

import sys
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from i18n import SUPPORTED  # noqa: E402
from mailer import templates as t  # noqa: E402
from recap import periodes  # noqa: E402
from recap.stats import resume  # noqa: E402
from utils.badges import libelles  # noqa: E402

# Lien de démonstration : les gabarits reçoivent le lien de désabonnement tout
# fait, précisément pour que cette prévisualisation tourne sans configuration.
LIEN_DEMO = "https://api.secu-cycle.fr/recaps/unsubscribe?u=42&t=jeton-de-demo"

_JUIN = datetime(2026, 6, 1)
_JUILLET = datetime(2026, 7, 1)

MOIS_CHARGE = {"trajets": 18, "km": 142.6, "minutes": 512, "denivele": 638.0,
               "trajets_avec_denivele": 18, "km_precedent": 96.0, "plus_long_km": 23.4,
               "trajets_surs": 11, "trajets_pluie": 3}

# Le cas qui compte pour la relecture : c'est lui qui montre les sections
# conditionnelles quand elles s'effacent (ni badge, ni comparaison, ni dénivelé).
MOIS_CREUX = {"trajets": 1, "km": 3.8, "minutes": 16, "denivele": 0.0,
              "trajets_avec_denivele": 0, "km_precedent": 0.0}

ANNEE = {"trajets": 164, "km": 1284.0, "minutes": 4620, "denivele": 5940.0,
         "trajets_avec_denivele": 164, "km_precedent": 1100.0, "plus_long_km": 47.2,
         "trajets_surs": 98, "trajets_pluie": 21}

# Les badges portent leur `code` : la prévisualisation passe ainsi par le vrai
# chemin de traduction, et pas seulement par le repli en base.
BADGES_MOIS = [
    {"code": "routes_10", "name": "10 itinéraires", "description": "Terminer 10 trajets."},
    {"code": "rain_rider", "name": "Rouleur sous la pluie",
     "description": "Terminer 5 trajets partis sous la pluie."},
]
BADGES_ANNEE = [
    {"code": "distance_200", "name": "200 km parcourus",
     "description": "Cumuler 200 km sur vos trajets terminés."},
]


def _recap(genre, brut, badges, prenom, mois_precedent, periode, locale):
    """Un cas de récapitulatif, rendu dans une langue."""
    badges = [{**b, **libelles(b, locale)} for b in badges]
    return t.recap_email(
        genre, periode, prenom,
        resume(brut, badges, mois_precedent, locale),
        LIEN_DEMO, locale,
    )


def cas(locale: str):
    """Les gabarits destinés à un utilisateur, rendus dans `locale`."""
    mois_precedent = periodes.libelle_periode_precedente("monthly", _JUIN, locale)
    juillet = periodes.libelle_periode("monthly", _JUILLET, locale)

    return [
        ("Vérification de compte", t.verification_email("123456", locale)),
        ("Réinitialisation de mot de passe", t.password_reset_email("123456", locale)),
        ("Changement d'e-mail — code (nouvelle adresse)",
         t.email_change_code_email("123456", "nouvelle@exemple.fr", locale)),
        ("Changement d'e-mail — alerte (ancienne adresse)",
         t.email_change_alert_email("nouvelle@exemple.fr", locale)),
        ("Suppression de compte", t.account_deleted_email(locale)),
        ("Récapitulatif mensuel — mois chargé",
         _recap("monthly", MOIS_CHARGE, BADGES_MOIS, "Alexis", mois_precedent, juillet, locale)),
        ("Récapitulatif mensuel — mois creux (sections conditionnelles effacées)",
         _recap("monthly", MOIS_CREUX, [], None, mois_precedent, juillet, locale)),
        ("Récapitulatif annuel",
         _recap("yearly", ANNEE, BADGES_ANNEE, "Alexis", "2025", "2026", locale)),
    ]


def pages(locale: str):
    """Pages web servies par l'API, relues ici avec les e-mails.

    Elles partagent la charte des e-mails (`_shell`) et se dégraderaient en
    silence si personne ne les regardait.
    """
    return [
        ("Désabonnement — confirmation", t.unsubscribe_confirm_page(LIEN_DEMO, locale)),
        ("Désabonnement — enregistré", t.unsubscribe_done_page(locale)),
        ("Désabonnement — lien invalide", t.unsubscribe_invalid_page(locale)),
    ]



def _section_email(nom: str, locale: str, rendu) -> str:
    subject, html, text = rendu
    return f"""
<section style="margin-bottom: 48px;">
  <h2 style="font: bold 16px/1.4 system-ui, sans-serif; margin: 0 0 4px;">{nom}
    <span style="font-weight: normal; color: #888;">— {locale}</span></h2>
  <p style="font: 13px/1.4 system-ui, sans-serif; color: #555; margin: 0 0 12px;">
    <strong>Objet :</strong> {subject}
  </p>
  <div style="border: 1px dashed #bbb;">{html}</div>
  <details style="margin-top: 8px; font: 13px/1.5 system-ui, sans-serif;">
    <summary style="cursor: pointer;">Version texte brut (repli sans HTML)</summary>
    <pre style="background: #f5f5f5; padding: 12px; white-space: pre-wrap;">{text}</pre>
  </details>
</section>"""


def _section_page(nom: str, locale: str, html: str) -> str:
    return f"""
<section style="margin-bottom: 48px;">
  <h2 style="font: bold 16px/1.4 system-ui, sans-serif; margin: 0 0 4px;">{nom}
    <span style="font-weight: normal; color: #888;">— {locale}</span></h2>
  <p style="font: 13px/1.4 system-ui, sans-serif; color: #555; margin: 0 0 12px;">
    Page web, pas un e-mail.
  </p>
  <div style="border: 1px dashed #bbb;">{html}</div>
</section>"""


def _par_langue(rendre) -> list[tuple[str, list]]:
    """[(nom, [(locale, rendu), …]), …] — les langues groupées par gabarit.

    C'est le regroupement qui compte pour la relecture : on compare deux
    traductions du même message, pas deux messages de la même langue.
    """
    rendus = {locale: dict(rendre(locale)) for locale in SUPPORTED}
    return [(nom, [(locale, rendus[locale][nom]) for locale in SUPPORTED])
            for nom, _ in rendre(SUPPORTED[0])]


def build_page() -> tuple[str, int]:
    sections, rendus = [], 0

    for nom, traductions in _par_langue(cas):
        for locale, rendu in traductions:
            sections.append(_section_email(nom, locale, rendu))
            rendus += 1

    # Le formulaire de contact part vers l'équipe, pas vers un utilisateur : il
    # reste en français, comme le dashboard d'administration.
    sections.append(_section_email(
        "Formulaire de contact (vers l'équipe — non traduit)", "fr",
        t.contact_email(
            "Jean", "Dupont", "jean.dupont@exemple.fr", "Question sur un itinéraire",
            "Bonjour,\n\nJ'ai une question à propos d'un trajet.\n\nMerci !",
        ),
    ))
    rendus += 1

    for nom, traductions in _par_langue(pages):
        for locale, html in traductions:
            sections.append(_section_page(nom, locale, html))
            rendus += 1

    page = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Prévisualisation des e-mails Sécu'Cycle</title></head>
<body style="margin: 0; padding: 24px; background: #fff;">
<h1 style="font: bold 20px/1.4 system-ui, sans-serif;">Gabarits d'e-mails Sécu'Cycle</h1>
<p style="font: 13px/1.5 system-ui, sans-serif; color: #555; max-width: 62ch;">
  Chaque gabarit est rendu dans les {len(SUPPORTED)} langues servies, l'une sous
  l'autre. Rendu dans un navigateur, plus permissif que les clients de messagerie
  (Outlook ignore notamment les coins arrondis). Le logo est chargé depuis
  <code>{t.LOGO_URL}</code> : coupez les images du navigateur pour simuler un
  client qui les bloque — tout doit rester lisible.
</p>
{"".join(sections)}
</body></html>"""
    return page, rendus


def main() -> None:
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else BACKEND_DIR / ".mail-preview"
    out_dir.mkdir(parents=True, exist_ok=True)

    page, rendus = build_page()
    target = out_dir / "emails.html"
    target.write_text(page, encoding="utf-8")
    print(f"📧 {rendus} rendus écrits dans {target}")


if __name__ == "__main__":
    main()
