import { Link } from "react-router";
import Meta from "../components/Meta";
import "./legal.css";
import { useLocalizedPath } from '../i18n/useLang';

const SUPPRIME = [
    ["Compte et identifiants", "Adresse e-mail, mot de passe, sessions de connexion ouvertes sur tous vos appareils"],
    ["Informations personnelles", "Prénom, nom, date de naissance, niveau sportif"],
    ["Adresses", "Adresse de domicile et adresse de travail"],
    ["Vélos", "Nom, type et assistance électrique de chacun de vos vélos"],
    ["Itinéraires et historique", "Points de départ et d'arrivée, tracés calculés, historique de vos trajets"],
    ["Badges", "Badges obtenus et progression associée"],
];

const CONSERVE = [
    [
        "Signalements de dangers",
        "Ils restent visibles pour les autres cyclistes, mais leur lien avec votre compte est supprimé : plus rien ne permet de vous les rattacher. Cette conservation répond à un intérêt légitime, la sécurité des cyclistes.",
    ],
    [
        "Journaux techniques",
        "Les journaux du serveur (horodatage, adresse IP, requête) sont conservés 12 mois au maximum, à des fins de sécurité et de diagnostic.",
    ],
    [
        "Statistiques d'audience",
        "Elles sont anonymes et agrégées dès l'origine : elles ne contiennent aucune donnée permettant de vous identifier, et ne peuvent donc pas être rattachées à un compte pour en être retirées.",
    ],
];

export default function SuppressionComptePage() {
    const path = useLocalizedPath();
    return (
        <>
            <Meta
                title="Sécu'Cycle | Supprimer mon compte"
                description="Comment supprimer votre compte Sécu'Cycle depuis l'application mobile ou le site, quelles données sont effacées et lesquelles sont conservées."
            />
            <div className="legal-page">
                <article className="legal-content">
                    <h1>Supprimer mon compte</h1>
                    <p className="legal-updated">Dernière mise à jour : 24 août 2026</p>

                    <p>
                        Vous pouvez supprimer votre compte Sécu'Cycle à tout moment, sans avoir à nous
                        contacter, depuis l'application mobile comme depuis ce site. Cette page décrit la
                        marche à suivre, ce qui est effacé et ce qui subsiste.
                    </p>

                    <div className="legal-callout">
                        <p>
                            <strong>La suppression est immédiate et définitive.</strong> Il n'existe ni délai
                            de rétractation, ni sauvegarde de secours permettant de restaurer un compte
                            supprimé. Vous pourrez en revanche créer un nouveau compte quand vous le
                            souhaitez.
                        </p>
                    </div>

                    <h2>1. Depuis l'application mobile</h2>
                    <ol>
                        <li>Ouvrez l'application Sécu'Cycle et connectez-vous&nbsp;;</li>
                        <li>Rendez-vous dans l'onglet <strong>Profil</strong>, puis ouvrez les <strong>Paramètres</strong>&nbsp;;</li>
                        <li>Dans la section <strong>Zone de danger</strong>, appuyez sur <strong>Supprimer mon compte</strong>&nbsp;;</li>
                        <li>Confirmez avec votre mot de passe, puis validez l'avertissement.</li>
                    </ol>

                    <h2>2. Depuis ce site</h2>
                    <ol>
                        <li>Connectez-vous, puis ouvrez votre <Link to={path("profil")}>page de profil</Link>&nbsp;;</li>
                        <li>Tout en bas, dans <strong>Supprimer mon compte</strong>, cliquez sur <strong>Supprimer</strong>&nbsp;;</li>
                        <li>Confirmez avec votre mot de passe et cochez la case d'avertissement.</li>
                    </ol>

                    <p>
                        Votre mot de passe vous est redemandé dans les deux cas&nbsp;: un téléphone laissé
                        déverrouillé ou une session oubliée ne suffit pas à effacer un compte.
                    </p>

                    <h2>3. Données supprimées</h2>
                    <p>Sont effacées de nos serveurs, immédiatement et sans conservation&nbsp;:</p>
                    <div className="legal-table-wrapper">
                        <table className="legal-table">
                            <thead>
                                <tr>
                                    <th>Donnée</th>
                                    <th>Détail</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SUPPRIME.map(([nom, detail]) => (
                                    <tr key={nom}>
                                        <td><strong>{nom}</strong></td>
                                        <td>{detail}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p>
                        Un e-mail de confirmation vous est envoyé à l'adresse du compte juste après la
                        suppression. C'est le dernier message que vous recevrez de notre part.
                    </p>

                    <h2>4. Données conservées</h2>
                    <div className="legal-table-wrapper">
                        <table className="legal-table">
                            <thead>
                                <tr>
                                    <th>Donnée</th>
                                    <th>Pourquoi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {CONSERVE.map(([nom, detail]) => (
                                    <tr key={nom}>
                                        <td><strong>{nom}</strong></td>
                                        <td>{detail}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h2>5. Si vous n'avez plus accès à votre compte</h2>
                    <p>
                        Mot de passe perdu&nbsp;? Commencez par le réinitialiser depuis l'écran de
                        connexion, puis suivez la procédure ci-dessus. Si vous n'accédez plus à l'adresse
                        e-mail rattachée au compte, écrivez-nous à{" "}
                        <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a> depuis n'importe
                        quelle adresse&nbsp;: nous vous demanderons de quoi vérifier que le compte est bien
                        le vôtre, puis nous procéderons à la suppression. Nous répondons sous un mois au
                        plus, conformément au RGPD.
                    </p>

                    <h2>6. Vos autres droits</h2>
                    <p>
                        La suppression du compte n'est qu'un des droits que vous tenez du RGPD. L'accès, la
                        rectification, la limitation, l'opposition et la portabilité de vos données sont
                        détaillés dans notre{" "}
                        <Link to={path("confidentialite")}>politique de confidentialité</Link>. Pour toute autre
                        demande, la <Link to={path("contact")}>page de contact</Link> est à votre disposition.
                    </p>
                </article>
            </div>
        </>
    );
}
