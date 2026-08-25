import { Link } from "react-router";
import Meta from "../components/Meta";
import "./legal.css";
import { useLocalizedPath } from '../i18n/useLang';

export default function ConfidentialitePage() {
    const path = useLocalizedPath();
    return (
        <>
            <Meta
                title="Sécu'Cycle | Politique de confidentialité"
                description="Politique de confidentialité de Sécu'Cycle : données collectées, finalités, durée de conservation et vos droits (RGPD) sur le site et l'app mobile."
            />
            <div className="legal-page">
                <article className="legal-content">
                    <h1>Politique de confidentialité</h1>
                    <p className="legal-updated">Dernière mise à jour : 24 août 2026</p>

                    <p>
                        La présente politique explique quelles données personnelles sont traitées lorsque vous
                        utilisez le site <strong>secu-cycle.fr</strong> et l'application mobile
                        <strong> Sécu'Cycle</strong>, dans quel but, sur quelle base légale, pendant combien de
                        temps et quels sont vos droits. Elle est rédigée conformément au Règlement général sur la
                        protection des données (RGPD, articles 12 à 14) et à la loi Informatique et Libertés.
                    </p>

                    <h2>1. Responsables du traitement</h2>
                    <p>
                        Le traitement de vos données est placé sous la responsabilité conjointe de{" "}
                        <strong>Alexis Gaudray Bouju</strong> et <strong>Matheline Chevalier</strong>, éditeurs
                        du projet étudiant Sécu'Cycle (ENSEIRB-MATMECA). Aucun délégué à la protection des
                        données (DPO) n'a été désigné, le projet n'y étant pas soumis.
                    </p>
                    <p>
                        Pour toute question ou pour exercer vos droits :{" "}
                        <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>. Les informations
                        d'identification complètes figurent dans les{" "}
                        <Link to={path("mentionsLegales")}>mentions légales</Link>.
                    </p>

                    <h2>2. Données que nous traitons</h2>

                    <h3>2.1. Données de compte</h3>
                    <p>
                        Lors de la création d'un compte et de l'utilisation du service, nous traitons&nbsp;:
                    </p>
                    <ul>
                        <li>Adresse e-mail et mot de passe (le mot de passe est stocké de façon sécurisée sous forme de <strong>hachage Argon2</strong>, jamais en clair)&nbsp;;</li>
                        <li>Prénom, nom et date de naissance&nbsp;;</li>
                        <li>Niveau sportif déclaré&nbsp;;</li>
                        <li>Adresses de domicile et de travail (si vous les renseignez)&nbsp;;</li>
                        <li>Vos vélos (nom, type, assistance électrique).</li>
                    </ul>

                    <h3>2.2. Données de localisation et d'itinéraire</h3>
                    <ul>
                        <li>Points de départ et d'arrivée lors du calcul d'un itinéraire&nbsp;;</li>
                        <li>Le tracé (géométrie) des itinéraires calculés et leur historique&nbsp;;</li>
                        <li>La position précise (coordonnées GPS) associée aux signalements de dangers que vous créez&nbsp;;</li>
                        <li>Pendant la navigation guidée, votre position est transmise en temps réel au serveur pour recaler le guidage.</li>
                    </ul>
                    <div className="legal-callout">
                        <p>
                            <strong>Important :</strong> votre position transmise en direct pendant la navigation
                            n'est <strong>pas conservée</strong>. Elle est traitée à la volée en mémoire pour vous
                            guider, puis n'est pas enregistrée dans notre base de données. Seuls le tracé des
                            itinéraires calculés et les points de signalement sont conservés.
                        </p>
                    </div>

                    <h3>2.3. Données d'usage (statistiques de fréquentation)</h3>
                    <p>
                        Nous mesurons l'audience à l'aide d'outils respectueux de la vie privée&nbsp;:
                    </p>
                    <ul>
                        <li><strong>Site web :</strong> <a href="https://umami.is/" target="_blank" rel="noopener noreferrer">Umami</a>, auto-hébergé sur nos serveurs, <strong>sans cookie ni traceur</strong> et sans collecte de données permettant de vous identifier. Aucun bandeau de consentement n'est donc requis.</li>
                        <li><strong>Application mobile :</strong> <a href="https://aptabase.com/" target="_blank" rel="noopener noreferrer">Aptabase</a> (région d'hébergement Union européenne), qui enregistre des événements d'usage anonymes (ouverture d'écran, démarrage d'une navigation, etc.) <strong>sans e-mail, sans nom et sans coordonnées GPS</strong>.</li>
                    </ul>
                    <p>
                        Le site utilise uniquement le stockage local du navigateur à des fins techniques
                        (mémorisation du thème clair/sombre et de votre session), et non à des fins de suivi
                        publicitaire.
                    </p>

                    <h2>3. Permissions demandées par l'application mobile</h2>
                    <p>
                        L'application ne demande que les permissions strictement nécessaires à son
                        fonctionnement. Chacune vous est demandée par votre téléphone et peut être refusée ou
                        révoquée à tout moment dans les réglages du système.
                    </p>
                    <div className="legal-table-wrapper">
                        <table className="legal-table">
                            <thead>
                                <tr>
                                    <th>Permission</th>
                                    <th>Finalité</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Localisation — premier plan</strong> (précise)</td>
                                    <td>Vous géolocaliser et assurer le guidage vélo en temps réel lorsque l'application est ouverte.</td>
                                </tr>
                                <tr>
                                    <td><strong>Localisation — arrière-plan</strong> (précise)</td>
                                    <td>Poursuivre le guidage lorsque l'écran est éteint ou que le téléphone est dans votre poche. Utilisée uniquement pour la navigation, jamais à des fins publicitaires ou statistiques.</td>
                                </tr>
                                <tr>
                                    <td><strong>Notifications</strong></td>
                                    <td>Afficher la notification persistante « Guidage en cours » signalant que la navigation reste active en arrière-plan.</td>
                                </tr>
                                <tr>
                                    <td><strong>Microphone</strong> (iOS)</td>
                                    <td>Nécessaire à la <strong>synthèse vocale</strong> des instructions de navigation. <strong>Aucun son n'est enregistré ni transmis.</strong></td>
                                </tr>
                                <tr>
                                    <td><strong>Vibration / retour haptique</strong></td>
                                    <td>Retours tactiles de l'interface (confirmation d'actions).</td>
                                </tr>
                                <tr>
                                    <td><strong>Accès à Internet</strong></td>
                                    <td>Communication avec notre serveur, chargement des cartes et envoi des statistiques anonymes.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="legal-callout">
                        <p>
                            La <strong>localisation en arrière-plan</strong> est au cœur de la fonction de
                            navigation de Sécu'Cycle. Elle est activée uniquement pendant un guidage, avec votre
                            consentement explicite, et n'est jamais utilisée pour de la publicité ou du suivi.
                        </p>
                    </div>

                    <h2>4. Finalités et bases légales</h2>
                    <dl>
                        <dt>Gestion de votre compte et fourniture du service</dt>
                        <dd>Base légale : exécution du contrat (nos conditions d'utilisation).</dd>
                        <dt>Calcul d'itinéraires et navigation géolocalisée</dt>
                        <dd>Base légale : exécution du contrat et votre consentement, matérialisé par l'autorisation de localisation accordée au système d'exploitation.</dd>
                        <dt>Signalements de dangers</dt>
                        <dd>Base légale : intérêt légitime (améliorer la sécurité des cyclistes).</dd>
                        <dt>Mesure d'audience anonyme</dt>
                        <dd>Base légale : intérêt légitime (outils sans cookie ni traceur, sans données identifiantes).</dd>
                        <dt>Sécurité du service et journaux techniques</dt>
                        <dd>Base légale : intérêt légitime et respect de nos obligations légales.</dd>
                    </dl>

                    <h2>5. Destinataires et sous-traitants</h2>
                    <p>
                        Vos données ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires. Aucun
                        identifiant publicitaire n'est collecté. Nous faisons appel aux prestataires suivants,
                        strictement pour faire fonctionner le service&nbsp;:
                    </p>
                    <ul>
                        <li><strong>IONOS</strong> (Union européenne) — hébergement du site et de l'API&nbsp;;</li>
                        <li><strong>MapTiler</strong> — fourniture des fonds de carte (les coordonnées d'affichage de la carte transitent par ce service)&nbsp;;</li>
                        <li><strong>Base Adresse Nationale</strong> (adresse.data.gouv.fr, service public de l'État français) — autocomplétion des adresses que vous saisissez&nbsp;;</li>
                        <li><strong>Aptabase</strong> (région Union européenne) — statistiques anonymes de l'application&nbsp;;</li>
                        <li><strong>Umami</strong> — statistiques anonymes du site, auto-hébergé par nos soins.</li>
                    </ul>

                    <h2>6. Transferts hors Union européenne</h2>
                    <p>
                        L'hébergement et les statistiques sont réalisés au sein de l'Union européenne. Le service
                        cartographique <strong>MapTiler</strong> est établi en <strong>Suisse</strong>, pays
                        reconnu comme offrant un niveau de protection adéquat par décision de la Commission
                        européenne. Aucun autre transfert de données hors de l'Espace économique européen n'est
                        réalisé.
                    </p>

                    <h2>7. Durées de conservation</h2>
                    <ul>
                        <li><strong>Compte et données associées</strong> : conservés tant que votre compte est actif, puis supprimés à la suppression de votre compte&nbsp;;</li>
                        <li><strong>Historique et itinéraires</strong> : conservés jusqu'à leur suppression par vos soins ou jusqu'à la suppression de votre compte&nbsp;;</li>
                        <li><strong>Signalements de dangers</strong> : conservés pour la sécurité des cyclistes, dissociés de votre compte en cas de suppression de celui-ci&nbsp;;</li>
                        <li><strong>Journaux techniques</strong> : 12 mois maximum&nbsp;;</li>
                        <li><strong>Statistiques d'audience</strong> : agrégées et anonymes.</li>
                    </ul>

                    <h2>8. Vos droits</h2>
                    <p>
                        Conformément au RGPD, vous disposez des droits d'<strong>accès</strong>, de{" "}
                        <strong>rectification</strong>, d'<strong>effacement</strong>, de{" "}
                        <strong>limitation</strong>, d'<strong>opposition</strong>, de{" "}
                        <strong>portabilité</strong> de vos données, ainsi que du droit de{" "}
                        <strong>retirer votre consentement</strong> à tout moment (notamment en révoquant
                        l'autorisation de localisation dans les réglages de votre téléphone).
                    </p>
                    <p>
                        Vous pouvez <strong>supprimer votre compte vous-même</strong>, sans nous
                        contacter, depuis l'application mobile comme depuis ce site&nbsp;: la marche à
                        suivre et le détail de ce qui est effacé figurent sur la page{" "}
                        <Link to={path("suppressionCompte")}>Supprimer mon compte</Link>. Votre historique de
                        trajets peut également être supprimé seul, depuis votre profil.
                    </p>
                    <p>
                        Pour les autres droits, ou si vous n'avez plus accès à votre compte, écrivez-nous
                        à <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>.
                    </p>
                    <p>
                        Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous
                        pouvez introduire une réclamation auprès de la CNIL&nbsp;: Commission Nationale de
                        l'Informatique et des Libertés, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 —{" "}
                        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
                    </p>

                    <h2>9. Mineurs</h2>
                    <p>
                        Le service est réservé aux personnes âgées d'au moins <strong>15 ans</strong>, âge du
                        consentement numérique en France. Les personnes plus jeunes doivent obtenir l'accord de
                        leurs représentants légaux avant toute utilisation.
                    </p>

                    <h2>10. Décision automatisée</h2>
                    <p>
                        Le calcul d'itinéraires repose sur des algorithmes, mais ne constitue pas une décision
                        automatisée produisant des effets juridiques ou vous affectant de manière significative
                        au sens de l'article 22 du RGPD. Aucun profilage à finalité publicitaire n'est réalisé.
                    </p>

                    <h2>11. Sécurité</h2>
                    <p>
                        Les mots de passe sont hachés (Argon2), les échanges avec le serveur sont chiffrés (HTTPS)
                        et les jetons d'authentification sont stockés dans le coffre sécurisé du système
                        d'exploitation de votre téléphone.
                    </p>

                    <h2>12. Modification de la présente politique</h2>
                    <p>
                        Cette politique peut être mise à jour pour refléter les évolutions du service ou de la
                        réglementation. La date de dernière mise à jour figure en haut de page.
                    </p>
                </article>
            </div>
        </>
    );
}
