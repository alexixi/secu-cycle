import Meta from "../components/Meta";
import Header from "../components/layout/Header"
import './HomePage.css';
import IconButton from "../components/ui/IconButton";
import Logo from "../assets/logo.svg?react";
import apercuApplication from "../assets/screenshots/apercu_itineraire-left.png";
import { IoIosArrowDropdown } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa";

export default function HomePage() {
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
            <div id="home-faq-section">
                <section className="home-section">
                    <h2>Qu'est-ce que Sécu'Cycle ?</h2>
                    <p>
                        <em>Sécu'Cycle</em> est un projet développé par 6 étudiants de <em>l'ENSEIRB-MATMECA</em> dans le cadre d'un PFA. L'objectif de ce projet est de créer un site web et une application mobile qui aide les cyclistes à trouver des itinéraires sécurisés en fonction de leurs préférences et de leur profil et de leur équipement. Nous nous sommes focalisés sur la zone de Bordeaux et de notre campus universitaire pour affiner les résultats avec nos connaissances locals du terrain.
                    </p>
                </section>
                <section className="home-section">
                    <h2>Pourquoi Sécu'Cycle ?</h2>
                    <p>
                        Ce projet s'inscrit dans une démarche de promotion des <em>mobilités douces</em> et de la sécurité des cyclistes. En fournissant des itinéraires adaptés, Sécu'Cycle vise à encourager davantage de personnes à adopter le vélo comme moyen de transport quotidien, tout en réduisant les risques d'accidents.
                    </p>
                </section>
                <section className="home-section">
                    <h2>Sources des données</h2>
                    <p>
                        <em>Sécu'Cycle</em> combine différentes sources de données, principalement les données d'<a href="https://www.openstreetmap.fr/" target="_blank" rel="noopener noreferrer"><em>OpenStreetMap</em></a> pour la carte des routes et pistes cyclables. Nous utilisons d'autes sources comme la <a href="https://adresse.data.gouv.fr/" target="_blank" rel="noopener noreferrer">BAN</a> (Base Adresse Nationale) pour la complétion des adresses et les données de trafic du projet <a href="https://avatar.cerema.fr/" target="_blank" rel="noopener noreferrer"><em>Avatar</em></a> du Cerema. Pour l'affichage de la carte, nous utilisons <a href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer"><em>MapTiler</em></a> qui propose des tuiles cartographiques basées sur les données d'OpenStreetMap.
                    </p>
                </section>
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
