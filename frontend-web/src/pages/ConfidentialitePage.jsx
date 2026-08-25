import { Fragment } from "react";
import { Link } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import Meta from "../components/Meta";
import ExternalLink from "../components/ui/ExternalLink";
import "./legal.css";
import { useLocalizedPath } from '../i18n/useLang';

export default function ConfidentialitePage() {
    const { t } = useTranslation('legal');
    const path = useLocalizedPath();

    const composants = {
        b: <strong />,
        mail: <a href="mailto:contact@secu-cycle.fr" />,
        umami: <ExternalLink href="https://umami.is/" />,
        aptabase: <ExternalLink href="https://aptabase.com/" />,
        cnil: <ExternalLink href="https://www.cnil.fr" />,
        mentions: <Link to={path("mentionsLegales")} />,
        suppression: <Link to={path("suppressionCompte")} />,
    };
    const T = ({ k }) => <Trans t={t} i18nKey={k} components={composants} />;

    // Chaque ligne du tableau des permissions : intitulé puis finalité.
    const PERMISSIONS = ["premierPlan", "arrierePlan", "notifications", "micro", "vibration", "internet"];

    return (
        <>
            <Meta title={t('confidentialite.titrePage')} description={t('confidentialite.metaDescription')} />
            <div className="legal-page">
                <article className="legal-content">
                    <h1>{t('confidentialite.h1')}</h1>
                    <p className="legal-updated">{t('confidentialite.maj')}</p>

                    <p><T k="confidentialite.chapo" /></p>

                    <h2>{t('confidentialite.responsables.h2')}</h2>
                    <p><T k="confidentialite.responsables.conjointe" /></p>
                    <p><T k="confidentialite.responsables.exercer" /></p>

                    <h2>{t('confidentialite.donnees.h2')}</h2>

                    <h3>{t('confidentialite.donnees.compte.h3')}</h3>
                    <p><T k="confidentialite.donnees.compte.intro" /></p>
                    <ul>
                        {["email", "identite", "sport", "adresses", "velos"].map(cle => (
                            <li key={cle}><T k={`confidentialite.donnees.compte.${cle}`} /></li>
                        ))}
                    </ul>

                    <h3>{t('confidentialite.donnees.localisation.h3')}</h3>
                    <ul>
                        {["points", "trace", "signalements", "navigation"].map(cle => (
                            <li key={cle}><T k={`confidentialite.donnees.localisation.${cle}`} /></li>
                        ))}
                    </ul>
                    <div className="legal-callout">
                        <p><T k="confidentialite.donnees.localisation.encart" /></p>
                    </div>

                    <h3>{t('confidentialite.donnees.usage.h3')}</h3>
                    <p><T k="confidentialite.donnees.usage.intro" /></p>
                    <ul>
                        <li><T k="confidentialite.donnees.usage.umami" /></li>
                        <li><T k="confidentialite.donnees.usage.aptabase" /></li>
                    </ul>
                    <p><T k="confidentialite.donnees.usage.stockageLocal" /></p>

                    <h2>{t('confidentialite.permissions.h2')}</h2>
                    <p><T k="confidentialite.permissions.intro" /></p>
                    <div className="legal-table-wrapper">
                        <table className="legal-table">
                            <thead>
                                <tr>
                                    <th>{t('confidentialite.permissions.colPermission')}</th>
                                    <th>{t('confidentialite.permissions.colFinalite')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PERMISSIONS.map(cle => (
                                    <tr key={cle}>
                                        <td><T k={`confidentialite.permissions.${cle}`} /></td>
                                        <td><T k={`confidentialite.permissions.${cle}Fin`} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="legal-callout">
                        <p><T k="confidentialite.permissions.encart" /></p>
                    </div>

                    <h2>{t('confidentialite.finalites.h2')}</h2>
                    <dl>
                        {["compte", "navigation", "signalements", "audience", "securite"].map(cle => (
                            <Fragment key={cle}>
                                <dt><T k={`confidentialite.finalites.${cle}Dt`} /></dt>
                                <dd><T k={`confidentialite.finalites.${cle}Dd`} /></dd>
                            </Fragment>
                        ))}
                    </dl>

                    <h2>{t('confidentialite.destinataires.h2')}</h2>
                    <p><T k="confidentialite.destinataires.intro" /></p>
                    <ul>
                        {["ionos", "maptiler", "ban", "aptabase", "umami"].map(cle => (
                            <li key={cle}><T k={`confidentialite.destinataires.${cle}`} /></li>
                        ))}
                    </ul>

                    <h2>{t('confidentialite.transferts.h2')}</h2>
                    <p><T k="confidentialite.transferts.texte" /></p>

                    <h2>{t('confidentialite.conservation.h2')}</h2>
                    <ul>
                        {["compte", "historique", "signalements", "journaux", "statistiques"].map(cle => (
                            <li key={cle}><T k={`confidentialite.conservation.${cle}`} /></li>
                        ))}
                    </ul>

                    <h2>{t('confidentialite.droits.h2')}</h2>
                    <p><T k="confidentialite.droits.liste" /></p>
                    <p><T k="confidentialite.droits.suppression" /></p>
                    <p><T k="confidentialite.droits.autres" /></p>
                    <p><T k="confidentialite.droits.cnil" /></p>

                    <h2>{t('confidentialite.mineurs.h2')}</h2>
                    <p><T k="confidentialite.mineurs.texte" /></p>

                    <h2>{t('confidentialite.automatisee.h2')}</h2>
                    <p><T k="confidentialite.automatisee.texte" /></p>

                    <h2>{t('confidentialite.securite.h2')}</h2>
                    <p><T k="confidentialite.securite.texte" /></p>

                    <h2>{t('confidentialite.modification.h2')}</h2>
                    <p><T k="confidentialite.modification.texte" /></p>
                </article>
            </div>
        </>
    );
}
