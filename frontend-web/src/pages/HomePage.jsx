import { Trans, useTranslation } from "react-i18next";
import { useRef } from "react";
import { Link } from "react-router";
import Meta from "../components/Meta";
import './HomePage.css';
import IconButton from "../components/ui/IconButton";
import FaqRoute from "../components/home/FaqRoute";
import Logo from "../assets/logo.svg?react";
import apercuApplication from "../assets/screenshots/mobile/apercu_itineraire-left.webp";
import { IoIosArrowDropdown } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa";
import { useLocalizedPath } from '../i18n/useLang';
import { useTheme } from "../context/ThemeContext";

const CAS = ['projet', 'problematiques', 'pourquoi', 'sources'];

export default function HomePage() {
    const { t } = useTranslation('home');
    const path = useLocalizedPath();
    const { effectiveTheme } = useTheme();

    const composants = {
        mentions: <Link to={path("mentionsLegales")} />,
        donnees: <Link to={path("donnees")} />,
        carte: <Link to={path("carteHub")} />,
        itineraire: <Link to={path("itineraire")} />,
        bordeaux: <Link to={path("carteVille", { citySlug: "bordeaux" })} />,
        tournai: <Link to={path("carteVille", { citySlug: "tournai" })} />,
        confidentialite: <Link to={path("confidentialite")} />,
        conditions: <Link to={path("conditions")} />,
        contact: <Link to={path("contact")} />,
        mail: <a href="mailto:contact@secu-cycle.fr" />,
    };
    const T = ({ k }) => <Trans t={t} i18nKey={k} components={composants} />;
    const faqRef = useRef(null);

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
            // i18n-exempt: nom d'une personne de l'équipe
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
                    {/* i18n-exempt: nom de la marque */}
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
                {CAS.map((cle) => (
                    <section className="home-section" key={cle}>
                        <h2>{t(`cas.${cle}.h2`)}</h2>
                        <p><T k={`cas.${cle}.texte`} /></p>
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
                        <img
                            src="/store/googleplay.svg"
                            alt={t('application.googlePlayAlt')}
                            className="store-badge store-badge-indisponible"
                            width="239"
                            height="71"
                        />
                    </div>
                    <p className="store-bientot">{t('application.bientot')}</p>
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
            <aside id="launch-badge-container">
                <h2>{t('launch.title')}</h2>
                <div className="badges">
                    <a
                        href="https://smollaunch.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        <img
                            src={`/badges/smollaunch-featured-${effectiveTheme}.svg`}
                            // i18n-exempt: nom d'une marque
                            alt="Sécu'Cycle — Smol Launch"
                            loading="lazy"
                            width="250"
                            height="60"
                            />
                    </a>
                </div>
            </aside>
        </>
    )
}
