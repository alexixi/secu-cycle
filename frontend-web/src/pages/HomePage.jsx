import Header from "../components/layout/Header"
import './HomePage.css';
import IconButton from "../components/ui/IconButton";
import Logo from "../assets/logo.svg?react";
import { IoIosArrowDropdown } from "react-icons/io";

export default function HomePage() {
    return (
        <>
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
                        <em>Sécu'Cycle</em> est un projet développé par 6 étudiants de <em>l'ENSEIRB-MATMECA</em> dans le cadre d'un PFA. L'objectif de ce projet est de créer une application web et mobile qui aide les cyclistes à trouver des itinéraires sécurisés en fonction de leurs préférences et de leur profil. Nous nous sommes focalisés sur la zone de Bordeaux et de notre campus universitaire pour affiner les résultats avec nos connaissances locals du terrain.
                    </p>
                </section>
                <section className="home-section">
                    <h2>Pourquoi Sécu'Cycle ?</h2>
                    <p>
                        Ce projet s'inscrit dans une démarche de promotion de la <em>mobilité douce</em> et de la sécurité des cyclistes. En fournissant des itinéraires adaptés, Sécu'Cycle vise à encourager davantage de personnes à adopter le vélo comme moyen de transport quotidien, tout en réduisant les risques d'accidents.
                    </p>
                </section>
                <section className="home-section">
                    <h2>Source des données</h2>
                    <p>
                        <em>Sécu'Cycle</em> combine différentes sources de données, principalement les données d'<em>OpenStreetMap</em> pour la carte des routes et pistes cyclables. Nous utilisons d'autes sources comme les données d'accident de la route pour évaluer la sécurité des itinéraires.
                    </p>
                </section>
            </div>
        </>
    )
}
