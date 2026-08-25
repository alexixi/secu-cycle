import { Link } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import Meta from "../components/Meta";
import ExternalLink from "../components/ui/ExternalLink";
import "./legal.css";
import { useLocalizedPath } from '../i18n/useLang';

// Substitutions de <Trans> : le catalogue porte des ancres nommées (<osm>…</osm>),
// jamais des URL ni des indices de position. C'est lisible pour qui traduit, et une
// balise mal refermée ne peut pas décaler tout le paragraphe.
const LIENS = {
    osm: <ExternalLink href="https://www.openstreetmap.org/copyright" />,
    odbl: <ExternalLink href="https://opendatacommons.org/licenses/odbl/" />,
    ign: <ExternalLink href="https://geoservices.ign.fr/rgealti" />,
    ban: <ExternalLink href="https://adresse.data.gouv.fr/" />,
    lo: <ExternalLink href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" />,
    statbel: <ExternalLink href="https://statbel.fgov.be/fr/open-data/geolocalisation-des-accidents-de-la-circulation-2017-2024" />,
    ccby: <ExternalLink href="https://creativecommons.org/licenses/by/4.0/deed.fr" />,
    cams: <ExternalLink href="https://atmosphere.copernicus.eu/" />,
    waqi: <ExternalLink href="https://waqi.info/" />,
    maptiler: <ExternalLink href="https://www.maptiler.com/" />,
    mail: <a href="mailto:contact@secu-cycle.fr" />,
    b: <strong />,
};

export default function MentionsLegalesPage() {
    const { t } = useTranslation('legal');
    const path = useLocalizedPath();

    // Les liens internes suivent la langue de la page : ils ne peuvent donc pas
    // vivre au niveau module comme les liens sortants.
    const composants = {
        ...LIENS,
        donnees: <Link to={path("donnees")} />,
        confidentialite: <Link to={path("confidentialite")} />,
        conditions: <Link to={path("conditions")} />,
    };

    return (
        <>
            <Meta
                title={t('mentions.titrePage')}
                description={t('mentions.metaDescription')}
            />
            <div className="legal-page">
                <article className="legal-content">
                    <h1>{t('mentions.h1')}</h1>
                    <p className="legal-updated">{t('mentions.maj')}</p>

                    <p><Trans t={t} i18nKey="mentions.lcen" components={composants} /></p>

                    <h2>{t('mentions.editeurs.h2')}</h2>
                    <p><Trans t={t} i18nKey="mentions.editeurs.projet" components={composants} /></p>
                    <p><Trans t={t} i18nKey="mentions.editeurs.conjointement" components={composants} /></p>
                    <ul>
                        <li><strong>Alexis Gaudray Bouju</strong></li>
                        <li><strong>Matheline Chevalier</strong></li>
                    </ul>
                    <p><Trans t={t} i18nKey="mentions.editeurs.contact" components={composants} /></p>

                    <h2>{t('mentions.directeur.h2')}</h2>
                    <p><Trans t={t} i18nKey="mentions.directeur.texte" components={composants} /></p>

                    <h2>{t('mentions.hebergeur.h2')}</h2>
                    <p><Trans t={t} i18nKey="mentions.hebergeur.intro" components={composants} /></p>
                    {/* Coordonnées de l'hébergeur : une adresse postale ne se traduit pas. */}
                    <p>
                        <strong>IONOS SARL</strong><br />
                        7 place de la Gare, BP 70109<br />
                        57201 Sarreguemines Cedex, France<br />
                        {t('mentions.hebergeur.telephone')}<br />
                        <ExternalLink href="https://www.ionos.fr">www.ionos.fr</ExternalLink>
                    </p>

                    <h2>{t('mentions.propriete.h2')}</h2>
                    <p><Trans t={t} i18nKey="mentions.propriete.marque" components={composants} /></p>
                    <p><Trans t={t} i18nKey="mentions.propriete.sources" components={composants} /></p>
                    <ul>
                        <li><Trans t={t} i18nKey="mentions.propriete.osm" components={composants} /></li>
                        <li><Trans t={t} i18nKey="mentions.propriete.ign" components={composants} /></li>
                        <li><Trans t={t} i18nKey="mentions.propriete.statbel" components={composants} /></li>
                        <li><Trans t={t} i18nKey="mentions.propriete.cams" components={composants} /></li>
                        <li><Trans t={t} i18nKey="mentions.propriete.waqi" components={composants} /></li>
                        <li><Trans t={t} i18nKey="mentions.propriete.gbfs" components={composants} /></li>
                        <li><Trans t={t} i18nKey="mentions.propriete.maptiler" components={composants} /></li>
                    </ul>
                    <p><Trans t={t} i18nKey="mentions.propriete.detail" components={composants} /></p>

                    <h2>{t('mentions.donneesEtCgu.h2')}</h2>
                    <p><Trans t={t} i18nKey="mentions.donneesEtCgu.texte" components={composants} /></p>
                </article>
            </div>
        </>
    );
}
