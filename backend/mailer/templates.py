"""Gabarits d'e-mails.

Un builder par type d'e-mail, renvoyant le triplet `(subject, html, text)`
consommé par `mailer.send_email`. Ajouter un nouveau type de mail = ajouter
une fonction ici, sans toucher au transport.

Le HTML reste volontairement rudimentaire (styles en ligne, pas de feuille
externe, pas de flexbox) : les clients de messagerie ne supportent pas grand
chose de façon fiable.

**Les mots viennent du catalogue, la mise en forme reste ici.** Chaque builder
prend une locale ; c'est celle du *profil* du destinataire, jamais celle de la
requête — un récapitulatif part d'une boucle de fond, sans requête d'où la tirer
(voir `backend/i18n/__init__.py`). Deux conventions en découlent :

- **Aucune balise ni entité HTML dans le catalogue.** Les espaces insécables y
  sont de vrais U+00A0, qui rendent aussi bien en HTML qu'en texte brut — c'est
  ce qui permet à une même clé de servir les deux versions d'un message. Quand
  une portion doit être mise en avant (`<strong>`, `<a>`), elle est passée en
  paramètre : la balise reste dans le code.
- Le module n'importe que `html.escape` et `i18n`, qui ne lit que du JSON :
  ni base, ni réseau. C'est ce qui fait tourner `preview_emails.py` et les tests
  à sec.
"""

from html import escape

from i18n import DEFAULT_LOCALE, plural, t

BRAND = "#0078bc"
BRAND_DARK = "#1e2030"
BRAND_BG = "#e7ecfb"
TEXT_MUTED = "#4c4c4c"
BORDER = "#e2e8f0"

LOGO_URL = "https://secu-cycle.fr/pwa-192.png"
SITE_NAME = "Sécu'Cycle"
CONTACT_EMAIL = "contact@secu-cycle.fr"


def _shell(heading: str, body: str, locale: str = DEFAULT_LOCALE) -> str:
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
      {t("email.common.footer", locale)}
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


def _alerte(texte: str) -> str:
    """Encadré rouge des e-mails qui signalent une action non sollicitée."""
    return f"""\
      <div style="padding: 14px; border-radius: 10px; background-color: #fff1f1;
                  border: 1px solid #ffd5d5;">
        <p style="margin: 0; font-size: 14px; line-height: 21px; color: #b00020;">
           {texte}</p>
      </div>"""


def verification_email(code: str, locale: str = DEFAULT_LOCALE) -> tuple[str, str, str]:
    """E-mail de validation de compte contenant le code à 6 chiffres."""
    subject = t("email.verification.subject", locale)
    validite = t("email.common.code_validity", locale)
    consigne = t("email.verification.hint", locale)

    html = _shell(
        t("email.verification.heading", locale),
        f"""\
      <p style="margin: 0; font-size: 15px; line-height: 22px;">{t("email.verification.intro", locale)}</p>
{_code_block(code)}
      <p style="margin: 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         {validite} {consigne}</p>""",
        locale,
    )

    text = (
        f"{t('email.verification.heading', locale)}\n\n"
        f"{t('email.verification.text_code', locale, code=code)}\n\n"
        f"{validite} {consigne}"
    )

    return subject, html, text


def password_reset_email(code: str, locale: str = DEFAULT_LOCALE) -> tuple[str, str, str]:
    """E-mail de réinitialisation de mot de passe contenant le code à 6 chiffres."""
    subject = t("email.password_reset.subject", locale)
    validite = t("email.common.code_validity", locale)
    consigne = t("email.password_reset.hint", locale)

    html = _shell(
        t("email.password_reset.heading", locale),
        f"""\
      <p style="margin: 0; font-size: 15px; line-height: 22px;">{t("email.password_reset.intro", locale)}</p>
{_code_block(code)}
      <p style="margin: 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         {validite} {consigne}</p>""",
        locale,
    )

    text = (
        f"{subject}\n\n"
        f"{t('email.password_reset.text_code', locale, code=code)}\n\n"
        f"{validite} {consigne}"
    )

    return subject, html, text


def email_change_code_email(code: str, new_email: str,
                            locale: str = DEFAULT_LOCALE) -> tuple[str, str, str]:
    """E-mail envoyé à la NOUVELLE adresse : code prouvant qu'elle est bien
    contrôlée par le demandeur.

    `new_email` est saisi par l'utilisateur : il est échappé avant injection HTML.
    """
    subject = t("email.email_change_code.subject", locale)
    validite = t("email.common.code_validity", locale)

    html = _shell(
        t("email.email_change_code.heading", locale),
        f"""\
      <p style="margin: 0; font-size: 15px; line-height: 22px;">{
          t("email.email_change_code.intro", locale,
            email=f"<strong>{escape(new_email)}</strong>")}</p>
{_code_block(code)}
      <p style="margin: 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         {validite} {t("email.email_change_code.hint", locale)}</p>""",
        locale,
    )

    text = (
        f"{t('email.email_change_code.text_title', locale)}\n\n"
        f"{t('email.email_change_code.text_intro', locale, email=new_email)}\n"
        f"{t('email.email_change_code.text_code', locale, code=code)}\n\n"
        f"{validite} {t('email.email_change_code.text_hint', locale)}"
    )

    return subject, html, text


def email_change_alert_email(new_email: str,
                             locale: str = DEFAULT_LOCALE) -> tuple[str, str, str]:
    """E-mail envoyé à l'ANCIENNE adresse : alerte purement informative.

    Volontairement sans lien ni action : cet e-mail part vers une adresse dont
    le contrôle n'a pas été prouvé lors de la demande, il ne doit donc offrir
    aucune prise. Il oriente vers le seul recours encore valable pendant la
    fenêtre d'attaque : changer son mot de passe.
    """
    subject = t("email.email_change_alert.subject", locale)
    amorce = t("email.email_change_alert.warning_lead", locale)
    no_link = t("email.common.no_link", locale)

    html = _shell(
        t("email.email_change_alert.heading", locale),
        f"""\
      <p style="margin: 0; font-size: 15px; line-height: 22px;">{
          t("email.email_change_alert.intro", locale)}</p>
      <div style="margin: 20px 0; padding: 14px; text-align: center;
                  background-color: {BRAND_BG}; border-radius: 10px;">
        <span style="font-size: 16px; font-weight: bold; color: {BRAND};
                     word-break: break-all;">{escape(new_email)}</span>
      </div>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 22px;">{
          t("email.email_change_alert.effect", locale)}</p>
{_alerte(t("email.email_change_alert.warning", locale, lead=f"<strong>{amorce}</strong>"))}
      <p style="margin: 16px 0 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         {no_link}</p>""",
        locale,
    )

    text = (
        f"{t('email.email_change_alert.text_title', locale)}\n\n"
        f"{t('email.email_change_alert.text_intro', locale, email=new_email)}\n\n"
        f"{t('email.email_change_alert.effect', locale)}\n\n"
        f"{t('email.email_change_alert.warning', locale, lead=amorce)}\n\n"
        f"{no_link}"
    )

    return subject, html, text


def account_deleted_email(locale: str = DEFAULT_LOCALE) -> tuple[str, str, str]:
    """E-mail de confirmation envoyé juste après la suppression d'un compte.

    Comme `email_change_alert_email`, il ne contient aucun lien d'action : le
    compte n'existe plus, il n'y a rien à annuler. Il ne sert qu'à laisser une
    trace à l'utilisateur et à lui donner un recours si la suppression ne vient
    pas de lui.
    """
    subject = t("email.account_deleted.subject", locale)
    amorce = t("email.account_deleted.warning_lead", locale)
    no_link = t("email.common.no_link", locale)
    paragraphes = [t(f"email.account_deleted.{cle}", locale)
                   for cle in ("data", "reports", "final")]

    corps = "\n".join(
        f"""      <p style="margin: 0 0 16px; font-size: 15px; line-height: 22px;">{p}</p>"""
        for p in paragraphes
    )

    html = _shell(
        t("email.account_deleted.heading", locale),
        f"""\
{corps}
{_alerte(t("email.account_deleted.warning", locale,
           lead=f"<strong>{amorce}</strong>", email=CONTACT_EMAIL))}
      <p style="margin: 16px 0 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         {no_link}</p>""",
        locale,
    )

    text = "\n\n".join([
        subject,
        *paragraphes,
        t("email.account_deleted.warning", locale, lead=amorce, email=CONTACT_EMAIL),
        no_link,
    ])

    return subject, html, text


def contact_email(
    first_name: str,
    last_name: str,
    email: str,
    subject: str,
    message: str,
) -> tuple[str, str, str]:
    """Message envoyé depuis le formulaire de contact, à destination de l'équipe.

    Le seul gabarit qui ne prend pas de locale, et le seul resté en français :
    son destinataire est l'équipe, pas un utilisateur — comme le dashboard
    d'administration, qui n'est pas traduit non plus.

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


def _stat_grid(tuiles: list) -> str:
    """Grille de chiffres clés, en tableau.

    Un tableau et non une grille CSS : Outlook ignore `flex` comme `grid` et
    empilerait les tuiles les unes sous les autres. Deux colonnes, parce que
    trois deviennent illisibles sur un téléphone et qu'aucune requête média n'est
    fiable ici.
    """
    if not tuiles:
        return ""

    lignes = []
    for i in range(0, len(tuiles), 2):
        paire = tuiles[i:i + 2]
        cellules = []
        for tuile in paire:
            cellules.append(f"""\
        <td width="50%" style="padding: 6px;">
          <div style="padding: 14px 12px; background-color: {BRAND_BG};
                      border-radius: 10px; text-align: center;">
            <div style="font-size: 22px; font-weight: bold; color: {BRAND};
                        line-height: 28px;">{escape(tuile["valeur"])}</div>
            <div style="font-size: 12px; color: {TEXT_MUTED}; line-height: 18px;
                        ">{escape(tuile["libelle"])}</div>
          </div>
        </td>""")
        if len(paire) == 1:
            cellules.append('        <td width="50%"></td>')
        lignes.append("      <tr>\n" + "\n".join(cellules) + "\n      </tr>")

    return f"""\
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="margin: 20px 0; border-collapse: collapse;">
{chr(10).join(lignes)}
      </table>"""


def _badge_list(badges: list, locale: str = DEFAULT_LOCALE) -> str:
    """Badges débloqués pendant la période. Vide si aucun : pas de section creuse."""
    if not badges:
        return ""

    items = "\n".join(
        f"""\
        <li style="margin: 0 0 6px; font-size: 14px; line-height: 21px;">
          <strong>{escape(badge["nom"])}</strong>{
              " — " + escape(badge["description"]) if badge.get("description") else ""
          }</li>"""
        for badge in badges
    )

    titre = plural(len(badges), "email.recap.badges_one", "email.recap.badges_other", locale)
    return f"""\
      <div style="margin: 20px 0; padding: 16px; border: 1px solid {BORDER};
                  border-radius: 10px;">
        <div style="font-size: 15px; font-weight: bold; margin-bottom: 10px;
                    ">{titre}</div>
        <ul style="margin: 0; padding-left: 20px; color: {BRAND_DARK};">
{items}
        </ul>
      </div>"""


def _unsubscribe_footer(lien_desabo: str, locale: str = DEFAULT_LOCALE) -> str:
    """Pied de page portant le lien de désabonnement.

    Le lien figure dans le corps *en plus* des en-têtes `List-Unsubscribe` : tous
    les clients de messagerie n'affichent pas le bouton natif, et un désabonnement
    introuvable se transforme en signalement de spam.
    """
    return f"""\
      <p style="margin: 24px 0 0; padding-top: 16px; border-top: 1px solid {BORDER};
                font-size: 12px; line-height: 18px; color: {TEXT_MUTED};">
         {t("email.recap.unsubscribe_reason", locale)}
         <a href="{escape(lien_desabo, quote=True)}" style="color: {TEXT_MUTED};">
            {t("email.recap.unsubscribe_link", locale)}</a>.</p>"""


def recap_email(
    genre: str,
    libelle_periode: str,
    prenom: str | None,
    stats: dict,
    lien_desabo: str,
    locale: str = DEFAULT_LOCALE,
) -> tuple[str, str, str]:
    """Récapitulatif d'activité, mensuel ou annuel.

    Un seul gabarit pour les deux : seuls le titre et quelques tournures changent,
    et deux gabarits jumeaux divergeraient à la première retouche. Le sujet et le
    titre sont quatre clés entières et non un préfixe collé à `libelle_periode` :
    « Votre mois de juillet 2026 » n'a pas d'équivalent anglais qui garde la même
    découpe.

    Le lien de désabonnement est reçu en paramètre et jamais fabriqué ici : c'est
    ce qui permet à `preview_emails.py` de rendre ce gabarit sans variable
    d'environnement ni base de données.

    `prenom` vient du profil et n'est validé qu'en longueur : c'est le premier
    contenu utilisateur libre injecté dans un e-mail du projet, d'où l'échappement.

    :param stats: sortie de `recap.stats.resume`, déjà rendue dans `locale`.
    """
    suffixe = "yearly" if genre == "yearly" else "monthly"

    subject = t(f"email.recap.subject_{suffixe}", locale, periode=libelle_periode)
    titre = t(f"email.recap.title_{suffixe}", locale, periode=libelle_periode)

    salutation = (
        t("email.recap.greeting_named", locale, prenom=escape(prenom))
        if prenom else t("email.recap.greeting", locale)
    )
    intro = t("email.recap.intro", locale,
              periode=escape(libelle_periode),
              trajets=f"<strong>{escape(stats['phrase_trajets'])}</strong>")

    complements = []
    if stats.get("comparaison"):
        complements.append(
            f"""<p style="margin: 0 0 12px; font-size: 15px; line-height: 22px;"
               >{escape(stats["comparaison"])}</p>"""
        )
    if stats.get("trajet_le_plus_long"):
        complements.append(
            f"""<p style="margin: 0 0 12px; font-size: 14px; line-height: 21px; color: {TEXT_MUTED};"
               >{t("email.recap.longest", locale,
                    distance=escape(stats["trajet_le_plus_long"]))}</p>"""
        )
    if stats.get("trajets_surs"):
        complements.append(
            f"""<p style="margin: 0 0 12px; font-size: 14px; line-height: 21px; color: {TEXT_MUTED};"
               >{t("email.recap.safe_routes", locale, count=stats["trajets_surs"])}</p>"""
        )

    html = _shell(
        titre,
        f"""\
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 22px;">{salutation}</p>
      <p style="margin: 0 0 4px; font-size: 15px; line-height: 22px;">{intro}</p>
{_stat_grid(stats["tuiles"])}
{"".join(complements)}
{_badge_list(stats["badges"], locale)}
      <p style="margin: 16px 0 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         {t("email.recap.estimate_note", locale)}</p>
{_unsubscribe_footer(lien_desabo, locale)}""",
        locale,
    )

    salutation_texte = (
        t("email.recap.greeting_named", locale, prenom=prenom)
        if prenom else t("email.recap.greeting", locale)
    )
    lignes = [
        titre, "",
        salutation_texte, "",
        t("email.recap.intro", locale,
          periode=libelle_periode, trajets=stats["phrase_trajets"]),
        "",
    ]
    for tuile in stats["tuiles"]:
        # L'espace avant le deux-points est une règle française : la ligne
        # entière vient donc du catalogue, tiret de liste mis à part.
        lignes.append("- " + t("email.recap.tile_text", locale,
                               libelle=tuile["libelle"], valeur=tuile["valeur"]))
    if stats.get("comparaison"):
        lignes += ["", stats["comparaison"]]
    if stats.get("trajet_le_plus_long"):
        lignes.append(t("email.recap.longest", locale,
                        distance=stats["trajet_le_plus_long"]))
    if stats.get("trajets_surs"):
        lignes.append(t("email.recap.safe_routes", locale, count=stats["trajets_surs"]))
    if stats["badges"]:
        lignes += ["", t("email.recap.badges_text_header", locale)]
        lignes += [
            f"- {b['nom']}" + (f" — {b['description']}" if b.get("description") else "")
            for b in stats["badges"]
        ]
    lignes += [
        "",
        t("email.recap.estimate_note", locale),
        "",
        t("email.recap.unsubscribe_reason", locale),
        t("email.recap.unsubscribe_text", locale, lien=lien_desabo),
    ]

    return subject, html, "\n".join(lignes)


def unsubscribe_confirm_page(lien_action: str, locale: str = DEFAULT_LOCALE) -> str:
    """Page demandant confirmation avant de désabonner.

    Cette page ne désabonne pas : elle propose un bouton qui, lui, poste.

    La distinction n'est pas de la politesse HTTP. Outlook SafeLinks, les
    antivirus de messagerie et les proxys d'images visitent en `GET` les liens
    qu'ils trouvent dans un message, sans que personne n'ait cliqué. Un `GET` qui
    désabonnerait retirerait donc du service des gens qui n'ont rien demandé.

    La locale est celle du destinataire du lien, pas celle du navigateur : c'est
    la même que celle de l'e-mail d'où l'on vient.
    """
    return _shell(
        t("email.unsubscribe.confirm_heading", locale),
        f"""\
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 22px;">{
          t("email.unsubscribe.confirm_intro", locale)}</p>
      <form method="post" action="{escape(lien_action, quote=True)}" style="margin: 0;">
        <button type="submit"
                style="display: inline-block; padding: 12px 24px; font-size: 15px;
                       font-weight: bold; color: #ffffff; background-color: {BRAND};
                       border: 0; border-radius: 8px; cursor: pointer;">
          {t("email.unsubscribe.confirm_button", locale)}
        </button>
      </form>
      <p style="margin: 20px 0 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         {t("email.unsubscribe.confirm_note", locale)}</p>""",
        locale,
    )


def unsubscribe_done_page(locale: str = DEFAULT_LOCALE) -> str:
    """Page affichée une fois le désabonnement enregistré."""
    return _shell(
        t("email.unsubscribe.done_heading", locale),
        f"""\
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 22px;">{
          t("email.unsubscribe.done_intro", locale)}</p>
      <p style="margin: 0; font-size: 14px; line-height: 21px; color: {TEXT_MUTED};">
         {t("email.unsubscribe.done_note", locale)}</p>""",
        locale,
    )


def unsubscribe_invalid_page(locale: str = DEFAULT_LOCALE) -> str:
    """Page affichée quand le lien est illisible.

    Surtout pas un message de succès : un lien tronqué par un client de
    messagerie ferait croire au désabonnement alors que les envois continueraient.
    """
    lien = (f'<a href="mailto:{CONTACT_EMAIL}" style="color: {BRAND};"'
            f'>{CONTACT_EMAIL}</a>')
    return _shell(
        t("email.unsubscribe.invalid_heading", locale),
        f"""\
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 22px;">{
          t("email.unsubscribe.invalid_intro", locale)}</p>
      <p style="margin: 0; font-size: 14px; line-height: 21px; color: {TEXT_MUTED};">
         {t("email.unsubscribe.invalid_note", locale, email=lien)}</p>""",
        locale,
    )
