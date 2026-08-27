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


def email_change_code_email(code: str, new_email: str) -> tuple[str, str, str]:
    """E-mail envoyé à la NOUVELLE adresse : code prouvant qu'elle est bien
    contrôlée par le demandeur.

    `new_email` est saisi par l'utilisateur : il est échappé avant injection HTML.
    """
    subject = "Confirmez votre nouvelle adresse Sécu'Cycle"

    html = _shell(
        "Confirmation de votre nouvelle adresse",
        f"""\
      <p style="margin: 0; font-size: 15px; line-height: 22px;">Vous avez demandé à utiliser
         <strong>{escape(new_email)}</strong> comme adresse de connexion à votre compte
         Sécu'Cycle. Saisissez le code suivant dans l'application pour confirmer&nbsp;:</p>
{_code_block(code)}
      <p style="margin: 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         Ce code est valable 15&nbsp;minutes. Si vous n'êtes pas à l'origine de cette
         demande, ignorez cet e-mail&nbsp;: votre adresse reste inchangée et cette boîte
         ne sera associée à aucun compte.</p>""",
    )

    text = (
        "Confirmation de votre nouvelle adresse Sécu'Cycle\n\n"
        f"Vous avez demandé à utiliser {new_email} comme adresse de connexion.\n"
        f"Votre code de confirmation est : {code}\n\n"
        "Ce code est valable 15 minutes. "
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : "
        "votre adresse reste inchangée."
    )

    return subject, html, text


def email_change_alert_email(new_email: str) -> tuple[str, str, str]:
    """E-mail envoyé à l'ANCIENNE adresse : alerte purement informative.

    Volontairement sans lien ni action : cet e-mail part vers une adresse dont
    le contrôle n'a pas été prouvé lors de la demande, il ne doit donc offrir
    aucune prise. Il oriente vers le seul recours encore valable pendant la
    fenêtre d'attaque : changer son mot de passe.
    """
    subject = "Demande de changement d'adresse sur votre compte Sécu'Cycle"

    html = _shell(
        "Changement d'adresse demandé",
        f"""\
      <p style="margin: 0; font-size: 15px; line-height: 22px;">Une demande de changement
         de l'adresse de connexion de votre compte Sécu'Cycle vient d'être enregistrée,
         vers&nbsp;:</p>
      <div style="margin: 20px 0; padding: 14px; text-align: center;
                  background-color: {BRAND_BG}; border-radius: 10px;">
        <span style="font-size: 16px; font-weight: bold; color: {BRAND};
                     word-break: break-all;">{escape(new_email)}</span>
      </div>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 22px;">Le changement ne
         prendra effet qu'une fois un code de confirmation saisi depuis cette nouvelle
         adresse.</p>
      <div style="padding: 14px; border-radius: 10px; background-color: #fff1f1;
                  border: 1px solid #ffd5d5;">
        <p style="margin: 0; font-size: 14px; line-height: 21px; color: #b00020;">
           <strong>Si vous n'êtes pas à l'origine de cette demande</strong>, votre mot de
           passe est probablement compromis&nbsp;: changez-le immédiatement depuis
           l'application, puis contactez-nous.</p>
      </div>
      <p style="margin: 16px 0 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         Cet e-mail est purement informatif&nbsp;: il ne contient volontairement aucun
         lien.</p>""",
    )

    text = (
        "Changement d'adresse demandé sur votre compte Sécu'Cycle\n\n"
        f"Une demande de changement de votre adresse de connexion vers {new_email} "
        "vient d'être enregistrée.\n\n"
        "Le changement ne prendra effet qu'une fois un code de confirmation saisi "
        "depuis cette nouvelle adresse.\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, votre mot de passe est "
        "probablement compromis : changez-le immédiatement depuis l'application, "
        "puis contactez-nous.\n\n"
        "Cet e-mail est purement informatif : il ne contient volontairement aucun lien."
    )

    return subject, html, text


def account_deleted_email() -> tuple[str, str, str]:
    """E-mail de confirmation envoyé juste après la suppression d'un compte.

    Comme `email_change_alert_email`, il ne contient aucun lien d'action : le
    compte n'existe plus, il n'y a rien à annuler. Il ne sert qu'à laisser une
    trace à l'utilisateur et à lui donner un recours si la suppression ne vient
    pas de lui.
    """
    subject = "Votre compte Sécu'Cycle a été supprimé"

    html = _shell(
        "Compte supprimé",
        f"""\
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 22px;">Votre compte
         Sécu'Cycle vient d'être supprimé, ainsi que les données qui y étaient
         rattachées&nbsp;: vos informations personnelles, vos adresses, vos vélos, vos
         itinéraires et leurs tracés, votre historique et vos badges.</p>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 22px;">Les signalements
         de dangers que vous aviez créés restent visibles pour les autres cyclistes, mais
         ils ne sont plus reliés à votre compte.</p>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 22px;">Cette suppression
         est définitive&nbsp;: aucune restauration n'est possible. Vous pouvez bien sûr
         créer un nouveau compte à tout moment.</p>
      <div style="padding: 14px; border-radius: 10px; background-color: #fff1f1;
                  border: 1px solid #ffd5d5;">
        <p style="margin: 0; font-size: 14px; line-height: 21px; color: #b00020;">
           <strong>Si vous n'êtes pas à l'origine de cette suppression</strong>,
           écrivez-nous à contact@secu-cycle.fr.</p>
      </div>
      <p style="margin: 16px 0 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         Cet e-mail est purement informatif&nbsp;: il ne contient volontairement aucun
         lien.</p>""",
    )

    text = (
        "Votre compte Sécu'Cycle a été supprimé\n\n"
        "Votre compte vient d'être supprimé, ainsi que les données qui y étaient "
        "rattachées : vos informations personnelles, vos adresses, vos vélos, vos "
        "itinéraires et leurs tracés, votre historique et vos badges.\n\n"
        "Les signalements de dangers que vous aviez créés restent visibles pour les "
        "autres cyclistes, mais ils ne sont plus reliés à votre compte.\n\n"
        "Cette suppression est définitive : aucune restauration n'est possible. Vous "
        "pouvez créer un nouveau compte à tout moment.\n\n"
        "Si vous n'êtes pas à l'origine de cette suppression, écrivez-nous à "
        "contact@secu-cycle.fr.\n\n"
        "Cet e-mail est purement informatif : il ne contient volontairement aucun lien."
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


def _badge_list(badges: list) -> str:
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

    titre = "Nouveau badge" if len(badges) == 1 else f"{len(badges)} nouveaux badges"
    return f"""\
      <div style="margin: 20px 0; padding: 16px; border: 1px solid {BORDER};
                  border-radius: 10px;">
        <div style="font-size: 15px; font-weight: bold; margin-bottom: 10px;
                    ">{titre}</div>
        <ul style="margin: 0; padding-left: 20px; color: {BRAND_DARK};">
{items}
        </ul>
      </div>"""


def _unsubscribe_footer(lien_desabo: str) -> str:
    """Pied de page portant le lien de désabonnement.

    Le lien figure dans le corps *en plus* des en-têtes `List-Unsubscribe` : tous
    les clients de messagerie n'affichent pas le bouton natif, et un désabonnement
    introuvable se transforme en signalement de spam.
    """
    return f"""\
      <p style="margin: 24px 0 0; padding-top: 16px; border-top: 1px solid {BORDER};
                font-size: 12px; line-height: 18px; color: {TEXT_MUTED};">
         Vous recevez cet e-mail parce que vous avez un compte Sécu'Cycle.
         <a href="{escape(lien_desabo, quote=True)}" style="color: {TEXT_MUTED};">
            Ne plus recevoir ces récapitulatifs</a>.</p>"""


def recap_email(
    genre: str,
    libelle_periode: str,
    prenom: str | None,
    stats: dict,
    lien_desabo: str,
) -> tuple[str, str, str]:
    """Récapitulatif d'activité, mensuel ou annuel.

    Un seul gabarit pour les deux : seuls le titre et quelques tournures changent,
    et deux gabarits jumeaux divergeraient à la première retouche.

    Le lien de désabonnement est reçu en paramètre et jamais fabriqué ici : c'est
    ce qui permet à `preview_emails.py` de rendre ce gabarit sans variable
    d'environnement ni base de données.

    `prenom` vient du profil et n'est validé qu'en longueur : c'est le premier
    contenu utilisateur libre injecté dans un e-mail du projet, d'où l'échappement.

    :param stats: sortie de `recap.stats.resume`.
    """
    annuel = genre == "yearly"

    subject = (
        f"Votre année {libelle_periode} à vélo"
        if annuel
        else f"Votre mois de {libelle_periode} à vélo"
    )
    titre = f"Votre année {libelle_periode}" if annuel else f"Votre mois de {libelle_periode}"

    salutation = f"Bonjour {escape(prenom)}," if prenom else "Bonjour,"
    intro = (
        f"Voici ce que vous avez parcouru en {escape(libelle_periode)}&nbsp;: "
        f"<strong>{escape(stats['phrase_trajets'])}</strong>."
    )

    complements = []
    if stats.get("comparaison"):
        complements.append(
            f"""<p style="margin: 0 0 12px; font-size: 15px; line-height: 22px;"
               >{escape(stats["comparaison"])}</p>"""
        )
    if stats.get("trajet_le_plus_long"):
        complements.append(
            f"""<p style="margin: 0 0 12px; font-size: 14px; line-height: 21px; color: {TEXT_MUTED};"
               >Votre plus long trajet&nbsp;: {escape(stats["trajet_le_plus_long"])}.</p>"""
        )
    if stats.get("trajets_surs"):
        complements.append(
            f"""<p style="margin: 0 0 12px; font-size: 14px; line-height: 21px; color: {TEXT_MUTED};"
               >Dont {stats["trajets_surs"]} en itinéraire sécurisé.</p>"""
        )

    html = _shell(
        titre,
        f"""\
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 22px;">{salutation}</p>
      <p style="margin: 0 0 4px; font-size: 15px; line-height: 22px;">{intro}</p>
{_stat_grid(stats["tuiles"])}
{"".join(complements)}
{_badge_list(stats["badges"])}
      <p style="margin: 16px 0 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         Les durées sont celles estimées au calcul de vos itinéraires.</p>
{_unsubscribe_footer(lien_desabo)}""",
    )

    lignes = [titre, "", f"{salutation.replace('&nbsp;', ' ')}", "",
              f"Voici ce que vous avez parcouru en {libelle_periode} : {stats['phrase_trajets']}.", ""]
    for tuile in stats["tuiles"]:
        lignes.append(f"- {tuile['libelle']} : {tuile['valeur']}")
    if stats.get("comparaison"):
        lignes += ["", stats["comparaison"]]
    if stats.get("trajet_le_plus_long"):
        lignes.append(f"Votre plus long trajet : {stats['trajet_le_plus_long']}.")
    if stats.get("trajets_surs"):
        lignes.append(f"Dont {stats['trajets_surs']} en itinéraire sécurisé.")
    if stats["badges"]:
        lignes += ["", "Badges débloqués :"]
        lignes += [
            f"- {b['nom']}" + (f" — {b['description']}" if b.get("description") else "")
            for b in stats["badges"]
        ]
    lignes += [
        "",
        "Les durées sont celles estimées au calcul de vos itinéraires.",
        "",
        "Vous recevez cet e-mail parce que vous avez un compte Sécu'Cycle.",
        f"Pour ne plus recevoir ces récapitulatifs : {lien_desabo}",
    ]

    return subject, html, "\n".join(lignes)


def unsubscribe_confirm_page(lien_action: str) -> str:
    """Page demandant confirmation avant de désabonner.

    Cette page ne désabonne pas : elle propose un bouton qui, lui, poste.

    La distinction n'est pas de la politesse HTTP. Outlook SafeLinks, les
    antivirus de messagerie et les proxys d'images visitent en `GET` les liens
    qu'ils trouvent dans un message, sans que personne n'ait cliqué. Un `GET` qui
    désabonnerait retirerait donc du service des gens qui n'ont rien demandé.
    """
    return _shell(
        "Ne plus recevoir les récapitulatifs&nbsp;?",
        f"""\
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 22px;">Vous ne recevrez
         plus le récapitulatif mensuel et annuel de vos trajets. Votre compte et vos
         données restent inchangés.</p>
      <form method="post" action="{escape(lien_action, quote=True)}" style="margin: 0;">
        <button type="submit"
                style="display: inline-block; padding: 12px 24px; font-size: 15px;
                       font-weight: bold; color: #ffffff; background-color: {BRAND};
                       border: 0; border-radius: 8px; cursor: pointer;">
          Confirmer le désabonnement
        </button>
      </form>
      <p style="margin: 20px 0 0; font-size: 13px; line-height: 19px; color: {TEXT_MUTED};">
         Vous pourrez les réactiver à tout moment depuis les réglages de
         l'application.</p>""",
    )


def unsubscribe_done_page() -> str:
    """Page affichée une fois le désabonnement enregistré."""
    return _shell(
        "C'est fait",
        f"""\
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 22px;">Vous ne recevrez
         plus de récapitulatif d'activité.</p>
      <p style="margin: 0; font-size: 14px; line-height: 21px; color: {TEXT_MUTED};">
         Les e-mails liés à votre compte — vérification, réinitialisation de mot de
         passe — continuent d'être envoyés&nbsp;: ils ne relèvent pas de ce réglage.
         Vous pouvez réactiver les récapitulatifs quand vous le souhaitez depuis les
         réglages de l'application.</p>""",
    )


def unsubscribe_invalid_page() -> str:
    """Page affichée quand le lien est illisible.

    Surtout pas un message de succès&nbsp;: un lien tronqué par un client de
    messagerie ferait croire au désabonnement alors que les envois continueraient.
    """
    return _shell(
        "Ce lien n'est plus valide",
        f"""\
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 22px;">Nous n'avons pas
         pu traiter cette demande&nbsp;: le lien est incomplet ou a été remplacé.</p>
      <p style="margin: 0; font-size: 14px; line-height: 21px; color: {TEXT_MUTED};">
         Vous pouvez désactiver les récapitulatifs depuis les réglages de
         l'application, ou nous écrire à
         <a href="mailto:contact@secu-cycle.fr" style="color: {BRAND};"
            >contact@secu-cycle.fr</a>.</p>""",
    )
