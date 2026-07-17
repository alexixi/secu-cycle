import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Meta from "../components/Meta";
import { getFaqs } from "../services/apiBack";
import "./faq.css";

const DEFAULT_FAQS = [
    {
        question: "Qu'est-ce que Sécu'Cycle ?",
        answer:
            "Sécu'Cycle est un service gratuit, composé d'un site web et d'une application mobile, qui aide les cyclistes à trouver des itinéraires sécurisés. Plutôt que de proposer le trajet le plus court, Sécu'Cycle calcule un itinéraire qui privilégie la sécurité selon votre profil, vos préférences et votre équipement. Le projet a été développé par six étudiants de l'ENSEIRB-MATMECA (Bordeaux INP) dans le cadre d'un projet de fin d'année, avec un focus sur la métropole de Bordeaux.",
    },
    {
        question: "Comment est calculé un itinéraire sécurisé ?",
        answer:
            "Sécu'Cycle s'appuie sur un graphe routier construit à partir d'OpenStreetMap et enrichi de données topographiques de l'IGN (dénivelé) et de données de trafic. Chaque tronçon reçoit un coût qui tient compte de la présence de pistes cyclables, du type de route, du trafic automobile et de la pente. L'itinéraire proposé est celui qui minimise ce coût global de sécurité, et pas seulement la distance.",
    },
    {
        question: "Sécu'Cycle est-il gratuit ?",
        answer:
            "Oui. Le site web et l'application mobile sont entièrement gratuits et sans publicité. Sécu'Cycle est un projet étudiant à but non lucratif.",
    },
    {
        question: "Dans quelles villes Sécu'Cycle fonctionne-t-il ?",
        answer:
            "Le service est aujourd'hui optimisé pour la métropole de Bordeaux et ses environs, la zone sur laquelle nous avons affiné les données grâce à notre connaissance du terrain. La couverture peut être étendue à d'autres communes ; en dehors de la zone couverte, aucun itinéraire ne peut être calculé.",
    },
    {
        question: "Ai-je besoin d'un compte pour utiliser Sécu'Cycle ?",
        answer:
            "Vous pouvez calculer un itinéraire sans compte. La création d'un compte gratuit permet d'enregistrer votre profil et votre équipement, de conserver l'historique de vos trajets et de personnaliser davantage vos itinéraires.",
    },
    {
        question: "Existe-t-il une application mobile ?",
        answer:
            "Oui, une application mobile Sécu'Cycle est disponible en complément du site web. Elle offre une expérience optimisée pour la navigation en temps réel pendant vos trajets à vélo.",
    },
    {
        question: "D'où proviennent les données utilisées ?",
        answer:
            "Sécu'Cycle combine plusieurs sources ouvertes : OpenStreetMap (openstreetmap.fr) pour la carte des routes et pistes cyclables, l'IGN (ign.fr) pour les données topographiques, la Base Adresse Nationale (adresse.data.gouv.fr) pour les adresses, le projet AVATAR du Cerema (avatar.cerema.fr) pour le trafic routier, et MapTiler (maptiler.com) pour l'affichage des fonds de carte.",
    },
    {
        question: "Comment signaler un problème ou un danger sur un itinéraire ?",
        answer:
            "Vous pouvez signaler un danger ou un problème directement depuis l'application mobile. Ces signalements aident à améliorer la qualité des itinéraires proposés. Pour toute autre question, contactez-nous à l'adresse contact@secu-cycle.fr.",
    },
];

export default function FaqPage() {
    const [faqs, setFaqs] = useState(DEFAULT_FAQS);

    useEffect(() => {
        let active = true;
        getFaqs()
            .then((data) => {
                if (active && Array.isArray(data) && data.length > 0) {
                    setFaqs(data);
                }
            })
            .catch(() => {
            });
        return () => {
            active = false;
        };
    }, []);

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: f.answer,
            },
        })),
    };

    return (
        <>
            <Meta
                title="Sécu'Cycle | FAQ"
                description="Foire aux questions de Sécu'Cycle : itinéraires vélo sécurisés, fonctionnement, zones couvertes, application mobile, sources de données et compte utilisateur."
            />
            <Helmet>
                <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
            </Helmet>
            <div className="faq-page">
                <article className="faq-content">
                    <h1>Foire aux questions</h1>
                    <p className="faq-intro">
                        Vous trouverez ici les réponses aux questions les plus fréquentes sur
                        Sécu'Cycle, le service d'itinéraires à vélo sécurisés. Une autre question&nbsp;?
                        Écrivez-nous à <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>.
                    </p>

                    <div className="faq-list">
                        {faqs.map((f) => (
                            <details className="faq-item" key={f.id ?? f.question}>
                                <summary className="faq-question">
                                    <h2>{f.question}</h2>
                                    <span className="faq-chevron" aria-hidden="true" />
                                </summary>
                                <div className="faq-answer">
                                    <p>{f.answer}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </article>
            </div>
        </>
    );
}
