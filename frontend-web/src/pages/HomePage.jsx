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
    const path = useLocalizedPath();
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
            <Meta title="Sécu'Cycle | Accueil" description="Découvrez Sécu'Cycle, l'application et le site pour trouver des itinéraires à vélo sécurisés et adaptés à votre profil." />
            <div id="container-top-homepage">
                <Logo id="logo-homepage" />
                <div>
                    <h1 id="title-homepage">Sécu'Cycle</h1>
                    <p>Découvrez le projet</p>
                </div>
                <IconButton
                    onClick={
                        () => document.getElementById("home-faq-section").scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="scroll-button"
                    aria-label="Découvrir le projet"
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
                    <h2>Besoin de plus d'informations ?</h2>
                    <p>
                        Vous pouvez consulter les <Link to={path("mentionsLegales")}>Mentions légales</Link>,
                        les <Link to={path("donnees")}>sources des données</Link> utilisées,
                        nos <Link to={path("carteHub")}>cartes par ville</Link>,
                        la <Link to={path("confidentialite")}>Politique de confidentialité</Link> ou bien
                        les <Link to={path("conditions")}>conditions d'utilisation</Link>.
                        <br />
                        Vous avez des questions ? <br />
                        N'hésitez pas à nous contacter via notre <Link to={path("contact")}>formulaire de contact</Link>
                        ou à nous envoyer un email à l'adresse
                        <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>.

                    </p>
                </section>
            </div>
            <div id="app-section">
                <img className="app-visual" src={apercuApplication} alt="Aperçu de l'application mobile" width="800" height="1334" />
                <aside>
                    <h2>Découvrez notre application mobile</h2>
                    <p>
                        Téléchargez l'application mobile pour une expérience utilisateur optimisée pour la navigation en temps réel.
                    </p>
                    <div className="store-badges">
                        <a href="#app-section">
                            <img src="/store/appstore.svg" alt="Télécharger dans l'App Store" className="store-badge" width="127" height="40" />
                        </a>

                        <a href="#app-section">
                            <img src="/store/googleplay.svg" alt="Disponible sur Google Play" className="store-badge" width="239" height="71" />
                        </a>
                    </div>
                </aside>
            </div>
            <div id="team-section">
                <h2>L'équipe Sécu'Cycle</h2>
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
