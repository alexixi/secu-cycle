import { Link } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import Meta from "../components/Meta";
import "./legal.css";
import { useLocalizedPath } from '../i18n/useLang';

// Lignes des deux tableaux : seules les clés vivent ici, les libellés sont au
// catalogue sous <clé>Nom et <clé>Detail.
const SUPPRIME = ["compte", "identite", "adresses", "velos", "itineraires", "badges"];
const CONSERVE = ["signalements", "journaux", "statistiques"];

export default function SuppressionComptePage() {
    const { t } = useTranslation('legal');
    const path = useLocalizedPath();

    const composants = {
        b: <strong />,
        mail: <a href="mailto:contact@secu-cycle.fr" />,
        profil: <Link to={path("profil")} />,
        confidentialite: <Link to={path("confidentialite")} />,
        contact: <Link to={path("contact")} />,
    };
    const T = ({ k }) => <Trans t={t} i18nKey={k} components={composants} />;

    const Tableau = ({ section, cles, colonnes }) => (
        <div className="legal-table-wrapper">
            <table className="legal-table">
                <thead>
                    <tr>{colonnes.map(c => <th key={c}>{t(`suppression.${section}.${c}`)}</th>)}</tr>
                </thead>
                <tbody>
                    {cles.map(cle => (
                        <tr key={cle}>
                            <td><strong>{t(`suppression.${section}.${cle}Nom`)}</strong></td>
                            <td>{t(`suppression.${section}.${cle}Detail`)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <>
            <Meta title={t('suppression.titrePage')} description={t('suppression.metaDescription')} />
            <div className="legal-page">
                <article className="legal-content">
                    <h1>{t('suppression.h1')}</h1>
                    <p className="legal-updated">{t('suppression.maj')}</p>
                    <p><T k="suppression.chapo" /></p>

                    <div className="legal-callout">
                        <p><T k="suppression.encart" /></p>
                    </div>

                    <h2>{t('suppression.mobile.h2')}</h2>
                    <ol>
                        {["e1", "e2", "e3", "e4"].map(e => <li key={e}><T k={`suppression.mobile.${e}`} /></li>)}
                    </ol>

                    <h2>{t('suppression.site.h2')}</h2>
                    <ol>
                        {["e1", "e2", "e3"].map(e => <li key={e}><T k={`suppression.site.${e}`} /></li>)}
                    </ol>
                    <p><T k="suppression.site.motDePasse" /></p>

                    <h2>{t('suppression.supprimees.h2')}</h2>
                    <p><T k="suppression.supprimees.intro" /></p>
                    <Tableau section="supprimees" cles={SUPPRIME} colonnes={["colDonnee", "colDetail"]} />
                    <p><T k="suppression.supprimees.email" /></p>

                    <h2>{t('suppression.conservees.h2')}</h2>
                    <Tableau section="conservees" cles={CONSERVE} colonnes={["colDonnee", "colPourquoi"]} />

                    <h2>{t('suppression.acces.h2')}</h2>
                    <p><T k="suppression.acces.texte" /></p>

                    <h2>{t('suppression.autresDroits.h2')}</h2>
                    <p><T k="suppression.autresDroits.texte" /></p>
                </article>
            </div>
        </>
    );
}
