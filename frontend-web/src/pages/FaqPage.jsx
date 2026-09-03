import { Trans, useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";
import Meta from "../components/Meta";
import { useLang, useLocalizedPath } from "../i18n/useLang";
import { CITIES } from "../data/thematicMapsCore";
import "./faq.css";

// Les questions vivent dans le catalogue, pas en base. Le pré-rendu ne joint pas
// l'API : une question ajoutée depuis un dashboard n'aurait jamais été indexée,
// ni reprise dans le JSON-LD FAQPage servi aux moteurs. Le texte étant ici, ce que
// Google lit et ce que le visiteur voit sont la même chose, dans les deux langues.
const QUESTIONS = ['quoi', 'calcul', 'gratuit', 'villes', 'compte',
    'application', 'donnees', 'accidents', 'signalement'];

// Le JSON-LD veut du texte nu : si une réponse gagne un jour un lien, sa balise
// ne doit pas fuiter dans les données structurées.
// i18n-exempt: expression régulière, pas du texte d'interface
const sansBalises = (texte) => texte.replace(/<\/?\w+>/g, '');

export default function FaqPage() {
    const { t } = useTranslation('faq');
    const lang = useLang();
    const path = useLocalizedPath();

    // Une balise par ville du registre, plutôt qu'une liste recopiée ici : le
    // catalogue ne peut pas lier une ville qui n'a pas de page, et l'ajout d'une
    // ville au registre suffit à rendre sa balise utilisable.
    const composants = {
        carte: <Link to={path("carteHub")} />,
        itineraire: <Link to={path("itineraire")} />,
        donnees: <Link to={path("donnees")} />,
        mail: <a href="mailto:contact@secu-cycle.fr" />,
        ...Object.fromEntries(CITIES.map(({ slug }) => [
            slug, <Link to={path("carteVille", { citySlug: slug })} />,
        ])),
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: lang,
        mainEntity: QUESTIONS.map((cle) => ({
            "@type": "Question",
            name: t(`questions.${cle}.question`),
            acceptedAnswer: {
                "@type": "Answer",
                text: sansBalises(t(`questions.${cle}.reponse`)),
            },
        })),
    };

    return (
        <>
            <Meta
                title={t('titrePage')}
                description={t('metaDescription')}
            />
            <Helmet>
                <script type="application/ld+json">{JSON.stringify(faqJsonLd).replace(/</g, "\\u003c")}</script>
            </Helmet>
            <div className="faq-page">
                <article className="faq-content">
                    <h1>{t('h1')}</h1>
                    <p className="faq-intro">
                        <Trans t={t} i18nKey="intro" components={composants} />
                    </p>

                    <div className="faq-list">
                        {QUESTIONS.map((cle) => (
                            <details className="faq-item" key={cle}>
                                <summary className="faq-question">
                                    <h2>{t(`questions.${cle}.question`)}</h2>
                                    <span className="faq-chevron" aria-hidden="true" />
                                </summary>
                                <div className="faq-answer">
                                    <p><Trans t={t} i18nKey={`questions.${cle}.reponse`} components={composants} /></p>
                                </div>
                            </details>
                        ))}
                    </div>
                </article>
            </div>
        </>
    );
}
