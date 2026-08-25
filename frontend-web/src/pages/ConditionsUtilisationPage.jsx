import { Link } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import Meta from "../components/Meta";
import ExternalLink from "../components/ui/ExternalLink";
import "./legal.css";
import { useLocalizedPath } from '../i18n/useLang';

export default function ConditionsUtilisationPage() {
    const { t } = useTranslation('legal');
    const path = useLocalizedPath();

    const composants = {
        b: <strong />,
        mail: <a href="mailto:contact@secu-cycle.fr" />,
        odr: <ExternalLink href="https://ec.europa.eu/consumers/odr" />,
        donnees: <Link to={path("donnees")} />,
        confidentialite: <Link to={path("confidentialite")} />,
        suppression: <Link to={path("suppressionCompte")} />,
        mentions: <Link to={path("mentionsLegales")} />,
    };
    const T = ({ k }) => <Trans t={t} i18nKey={k} components={composants} />;

    return (
        <>
            <Meta title={t('cgu.titrePage')} description={t('cgu.metaDescription')} />
            <div className="legal-page">
                <article className="legal-content">
                    <h1>{t('cgu.h1')}</h1>
                    <p className="legal-updated">{t('cgu.maj')}</p>

                    <h2>{t('cgu.objet.h2')}</h2>
                    <p><T k="cgu.objet.texte" /></p>

                    <h2>{t('cgu.description.h2')}</h2>
                    <p><T k="cgu.description.texte" /></p>

                    <h2>{t('cgu.acces.h2')}</h2>
                    <p><T k="cgu.acces.texte" /></p>

                    <h2>{t('cgu.obligations.h2')}</h2>
                    <ul>
                        <li><T k="cgu.obligations.licite" /></li>
                        <li><T k="cgu.obligations.integrite" /></li>
                        <li><T k="cgu.obligations.signalements" /></li>
                        <li><T k="cgu.obligations.tiers" /></li>
                    </ul>

                    <h2>{t('cgu.securite.h2')}</h2>
                    <div className="legal-callout">
                        <p><T k="cgu.securite.aide" /></p>
                        <p><T k="cgu.securite.codeRoute" /></p>
                    </div>

                    <h2>{t('cgu.propriete.h2')}</h2>
                    <p><T k="cgu.propriete.texte" /></p>

                    <h2>{t('cgu.responsabilite.h2')}</h2>
                    <p><T k="cgu.responsabilite.texte" /></p>

                    <h2>{t('cgu.donnees.h2')}</h2>
                    <p><T k="cgu.donnees.texte" /></p>

                    <h2>{t('cgu.modification.h2')}</h2>
                    <p><T k="cgu.modification.texte" /></p>

                    <h2>{t('cgu.droit.h2')}</h2>
                    <p><T k="cgu.droit.texte" /></p>

                    <h2>{t('cgu.contact.h2')}</h2>
                    <p><T k="cgu.contact.texte" /></p>
                </article>
            </div>
        </>
    );
}
