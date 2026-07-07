import { useEffect, useRef, useState } from "react";
import Meta from "../components/Meta";
import Header from "../components/layout/Header"
import './HomePage.css';
import IconButton from "../components/ui/IconButton";
import FaqRoute from "../components/home/FaqRoute";
import Logo from "../assets/logo.svg?react";
import apercuApplication from "../assets/screenshots/mobile/apercu_itineraire-left.png";
import { IoIosArrowDropdown } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa";
import { getHomeCases } from "../services/apiBack";

// Contenu par défaut des cases : sert d'état initial (préserve le rendu
// prérendu par react-snap et fournit un repli si l'API est indisponible).
// Texte en clair : les liens et emphases d'origine sont aplatis.
const DEFAULT_CASES = [
    {
        title: "Qu'est-ce que Sécu'Cycle ?",
        text: "Sécu'Cycle est un projet développé par 6 étudiants de l'ENSEIRB-MATMECA dans le cadre d'un PFA. L'objectif de ce projet est de créer un site web et une application mobile qui aide les cyclistes à trouver des itinéraires sécurisés en fonction de leurs préférences, de leur profil et de leur équipement. Nous nous sommes focalisés sur la zone de Bordeaux et de notre campus universitaire pour affiner les résultats avec nos connaissances locales du terrain.",
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
        text: "Sécu'Cycle combine différentes sources de données, principalement les données d'OpenStreetMap (openstreetmap.fr) pour la carte des routes et pistes cyclables. Nous ajoutons à cette carte des données topographiques de l'IGN (ign.fr). Pour la complétion des adresses nous utilisons la BAN (Base Adresse Nationale, adresse.data.gouv.fr). Pour avoir des données de trafic de la circulation routière nous utilisons les données du projet Avatar du Cerema (avatar.cerema.fr). Enfin pour l'affichage de la carte, nous utilisons MapTiler (maptiler.com) qui propose des tuiles cartographiques basées sur les données d'OpenStreetMap.",
    },
];

export default function HomePage() {
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
                // On garde le contenu par défaut en cas d'erreur.
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
            <Header page="home" />
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
            </div>
            <div id="app-section">
                <img className="app-visual" src={apercuApplication} alt="Aperçu de l'application mobile" />
                <aside>
                    <h2>Découvrez notre application mobile</h2>
                    <p>
                        Téléchargez l'application mobile pour une expérience utilisateur optimisée pour la navigation en temps réel.
                    </p>
                    <div className="store-badges">
                        <a href="#app-section">
                            <img src="/store/appstore.svg" alt="Télécharger dans l'App Store" className="store-badge" />
                        </a>

                        <a href="#app-section">
                            <img src="/store/googleplay.svg" alt="Disponible sur Google Play" className="store-badge" />
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
