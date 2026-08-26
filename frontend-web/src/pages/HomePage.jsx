import { Trans, useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import Meta from "../components/Meta";
import './HomePage.css';
import IconButton from "../components/ui/IconButton";
import FaqRoute from "../components/home/FaqRoute";
import Logo from "../assets/logo.svg?react";
import apercuApplication from "../assets/screenshots/mobile/apercu_itineraire-left.webp";
import { IoIosArrowDropdown } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa";
import { getHomeCases } from "../services/apiBack";
import { useLocalizedPath } from '../i18n/useLang';

// Repli affiché tant que l'API n'a pas répondu, et surtout contenu que
// backend/sync_public_content.py rapproche des lignes en base EN UTILISANT LE
// TITRE FRANÇAIS COMME CLÉ. Ces textes restent donc des littéraux français :
// les déplacer dans un catalogue détacherait silencieusement les lignes déjà
// enregistrées, et la page prérendue divergerait de celle servie par l'API.
// La version anglaise viendra dans un tableau parallèle, indexé par position.
const DEFAULT_CASES = [
    {
        title: "Qu'est-ce que Sécu'Cycle ?",
        text: "Sécu'Cycle est un projet développé par 6 étudiants de l'ENSEIRB-MATMECA dans le cadre d'un PFA. L'objectif de ce projet est de créer un site web et une application mobile qui aide les cyclistes à trouver des itinéraires sécurisés en fonction de leurs préférences, de leur profil et de leur équipement. Nous avons d'abord affiné les résultats sur la zone de Bordeaux et de notre campus universitaire grâce à nos connaissances locales du terrain, puis étendu le calcul d'itinéraire à Tournai et ses environs. Les cartes thématiques en données ouvertes couvrent un territoire plus large, de Rennes et Nantes à Paris, Lyon, Lille, Strasbourg et Bruxelles.",
    },
    {
        title: "Problématiques",
        text: "Dans les nombreux freins à l'utilisation du vélo, la sécurité est un facteur déterminant. Les cyclistes sont souvent confrontés à des routes dangereuses ou à un manque d'infrastructures adaptées. Sécu'Cycle répond à ces problématiques en proposant des itinéraires optimisés pour la sécurité, en tenant compte des préférences et du profil de chaque utilisateur.",
    },
    {
        title: "Pourquoi Sécu'Cycle ?",
        text: "Sécu'Cycle a pour but de palier ces problèmes. Il s'inscrit dans une démarche de promotion des mobilités douces et de la sécurité des cyclistes. En fournissant des itinéraires adaptés, Sécu'Cycle vise à encourager davantage de personnes à adopter le vélo comme moyen de transport quotidien à la place de la voiture ou des transports en commun.",
    },
    {
        title: "Sources des données",
        text: "Sécu'Cycle croise une quinzaine de jeux de données, très majoritairement ouverts : OpenStreetMap pour le réseau routier, les aménagements cyclables, le revêtement et l'éclairage, l'IGN pour le dénivelé, les registres officiels d'accidentologie français et belge, le trafic en temps réel publié par quatre métropoles, la disponibilité des vélos en libre-service au format GBFS, l'indice européen de qualité de l'air du service Copernicus, et la Base Adresse Nationale pour les adresses. Les fonds de carte sont fournis par MapTiler, eux aussi construits sur les données d'OpenStreetMap. Le détail de chaque source, son usage, sa licence et son producteur sont listés sur notre page Sources des données.",
    },
];

export default function HomePage() {
    const { t } = useTranslation('home');
    const path = useLocalizedPath();

    const composants = {
        mentions: <Link to={path("mentionsLegales")} />,
        donnees: <Link to={path("donnees")} />,
        carte: <Link to={path("carteHub")} />,
        confidentialite: <Link to={path("confidentialite")} />,
        conditions: <Link to={path("conditions")} />,
        contact: <Link to={path("contact")} />,
        mail: <a href="mailto:contact@secu-cycle.fr" />,
    };
    const T = ({ k }) => <Trans t={t} i18nKey={k} components={composants} />;
    const faqRef = useRef(null);
    const [cases, setCases] = useState(DEFAULT_CASES);

    useEffect(() => {
        let active = true;
        getHomeCases()
            .then((data) => {
                if (active && Array.isArray(data) && data.length > 0) {
                    setCases(data);
                }
            })
            .catch(() => {
            });
        return () => {
            active = false;
        };
    }, []);

    const teamMembers = [
        {
            name: "Alexis Gaudray Bouju",
            linkedin: "https://www.linkedin.com/in/alexis-gaudray-bouju/"
        },
        {
            name: "Matheline Chevalier",
            linkedin: "https://www.linkedin.com/in/matheline-chevalier/"
        },
        {
            name: "Khaoula Najmeddine",
            linkedin: "https://www.linkedin.com/in/khaoula-najmeddine-18b4aa226/"
        },
        {
            name: "Angelo Tunney",
            linkedin: "https://www.linkedin.com/in/angelo-tunney-943081318/"
        },
        {
            name: "Joan Dumarchat",
            linkedin: "https://www.linkedin.com/in/joan-dumarchat-813269344/"
        },
        {
            name: "Léia Daragnès",
            linkedin: "https://www.linkedin.com/in/l%C3%A9ia-daragn%C3%A8s/"
        },

    ];

    return (
        <>
            <Meta title={t('titrePage')} description={t('metaDescription')} />
            <div id="container-top-homepage">
                <Logo id="logo-homepage" />
                <div>
                    <h1 id="title-homepage">Sécu'Cycle</h1>
                    <p>{t('sousTitre')}</p>
                </div>
                <IconButton
                    onClick={
                        () => document.getElementById("home-faq-section").scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="scroll-button"
                    aria-label={t('decouvrirProjet')}
                >
                    <IoIosArrowDropdown size={40} className="arrow-down" />
                </IconButton>
            </div>
            <div id="home-faq-section" ref={faqRef}>
                <FaqRoute sectionRef={faqRef} />
                {cases.map((c) => (
                    <section className="home-section" key={c.id ?? c.title}>
                        <h2>{c.title}</h2>
                        <p>{c.text}</p>
                    </section>
                ))}
                <section className="home-section">
                    <h2>{t('plusInfos.h2')}</h2>
                    <p>
                        <T k="plusInfos.liens" />
                        <br />
                        {t('plusInfos.questions')} <br />
                        <T k="plusInfos.contact" />
                    </p>
                </section>
            </div>
            <div id="app-section">
                <img className="app-visual" src={apercuApplication} alt={t('application.apercuAlt')} width="800" height="1334" />
                <aside>
                    <h2>{t('application.h2')}</h2>
                    <p>
                        {t('application.texte')}
                    </p>
                    <div className="store-badges">
                        <a href="#app-section">
                            <img src="/store/appstore.svg" alt={t('application.appStoreAlt')} className="store-badge" width="127" height="40" />
                        </a>

                        <a href="#app-section">
                            <img src="/store/googleplay.svg" alt={t('application.googlePlayAlt')} className="store-badge" width="239" height="71" />
                        </a>
                    </div>
                </aside>
            </div>
            <div id="team-section">
                <h2>{t('equipe.h2')}</h2>
                <div className="team-wrapper">
                    {teamMembers.map((member, index) => (
                        <a key={index} href={member.linkedin} target="_blank" rel="noopener noreferrer" className="team-member">
                            <FaLinkedin size={30} className="icon" />
                            <h3>{member.name}</h3>
                        </a>
                    ))}
                </div>
            </div>
        </>
    )
}
