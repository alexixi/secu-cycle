import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Meta from "../components/Meta";
import Button from "../components/ui/Button";
import { sendContactMessage } from "../services/apiBack";
import { trackEvent } from "../services/analytics";
import { LuSend, LuChevronDown, LuCheck } from "react-icons/lu";
import "../components/ui/Input.css";
import "../components/ui/Form.css";
import "./legal.css";

const EMPTY_FORM = { firstName: "", lastName: "", email: "", subject: "", message: "" };

const SUBJECTS = [
    "Support et bugs",
    "Suggestions",
    "Données personnelles (RGPD)",
    "Signalement",
    "Autre",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "Indiquez votre prénom.";
    if (!form.lastName.trim()) errors.lastName = "Indiquez votre nom.";
    if (!EMAIL_REGEX.test(form.email.trim())) errors.email = "Indiquez une adresse e-mail valide.";
    if (!SUBJECTS.includes(form.subject)) errors.subject = "Choisissez l'objet de votre demande.";
    if (form.message.trim().length < 10) errors.message = "Le message doit faire au moins 10 caractères.";
    return errors;
}

/** Menu déroulant maison : les <option> natives sont rendues par l'OS et ne se stylent pas. */
function SubjectSelect({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const closeOnOutsideClick = (e) => {
            if (!wrapperRef.current?.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeOnOutsideClick);
    }, [open]);

    const select = (label) => {
        onChange(label);
        setOpen(false);
    };

    const handleKeyDown = (e) => {
        switch (e.key) {
            case "Escape":
                setOpen(false);
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                if (open) select(SUBJECTS[activeIndex]);
                else setOpen(true);
                break;
            case "ArrowDown":
            case "ArrowUp": {
                e.preventDefault();
                const step = e.key === "ArrowDown" ? 1 : -1;
                if (!open) {
                    setOpen(true);
                    break;
                }
                setActiveIndex((i) => (i + step + SUBJECTS.length) % SUBJECTS.length);
                break;
            }
            default:
                break;
        }
    };

    const openMenu = () => {
        const selectedIndex = SUBJECTS.indexOf(value);
        setActiveIndex(selectedIndex === -1 ? 0 : selectedIndex);
        setOpen((wasOpen) => !wasOpen);
    };

    return (
        <div className="contact-select-wrapper" ref={wrapperRef}>
            <button
                type="button"
                id="contact-subject"
                className={"input contact-select" + (value ? "" : " contact-select-empty")}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={openMenu}
                onKeyDown={handleKeyDown}
            >
                <span>{value || "Choisissez l'objet de votre demande…"}</span>
                <LuChevronDown
                    className={"contact-select-chevron" + (open ? " contact-select-chevron-open" : "")}
                    size={18}
                />
            </button>

            {open && (
                <ul className="contact-options" role="listbox" aria-labelledby="contact-subject">
                    {SUBJECTS.map((subject, index) => (
                        <li
                            key={subject}
                            role="option"
                            aria-selected={value === subject}
                            className={
                                "contact-option"
                                + (value === subject ? " contact-option-selected" : "")
                                + (activeIndex === index ? " contact-option-active" : "")
                            }
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => select(subject)}
                        >
                            <span>{subject}</span>
                            {value === subject && <LuCheck size={15} />}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function ContactPage() {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState(null); // "sending" | "sent" | "error"
    const [errorMessage, setErrorMessage] = useState("");

    const updateField = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        if (status === "error") setStatus(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate(form);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setStatus("sending");
        try {
            await sendContactMessage(
                form.firstName.trim(),
                form.lastName.trim(),
                form.email.trim(),
                form.subject.trim(),
                form.message.trim(),
            );
            setForm(EMPTY_FORM);
            setStatus("sent");
            trackEvent("contact_message_sent");
        } catch (error) {
            console.error("Contact error:", error);
            setErrorMessage(
                error?.status === 429
                    ? "Vous avez envoyé trop de messages. Réessayez dans une heure ou écrivez-nous directement."
                    : "L'envoi a échoué. Réessayez plus tard ou écrivez-nous directement à contact@secu-cycle.fr.",
            );
            setStatus("error");
        }
    };

    return (
        <>
            <Meta
                title="Sécu'Cycle | Contact"
                description="Contacter l'équipe Sécu'Cycle : support, questions et exercice de vos droits sur vos données personnelles."
            />
            <div className="legal-page">
                <article className="legal-content">
                    <h1>Contact</h1>

                    <p>
                        Une question, un retour, un bug à signaler ou une demande
                        concernant vos données&nbsp;? Nous lisons tous les messages et vous répondons avec
                        plaisir.
                    </p>

                    <h2>Nous écrire</h2>
                    <p>
                        Remplissez le formulaire ci-dessous&nbsp;: votre message nous parvient directement et
                        nous vous répondons à l'adresse que vous indiquez.
                    </p>

                    <form className="contact-form" onSubmit={handleSubmit} noValidate>
                        <div className="contact-form-row">
                            <div className={"input-group" + (errors.firstName ? " input-error" : "")}>
                                <label htmlFor="contact-first-name">Prénom</label>
                                <input
                                    className="input"
                                    type="text"
                                    id="contact-first-name"
                                    autoComplete="given-name"
                                    value={form.firstName}
                                    onChange={updateField("firstName")}
                                />
                                {errors.firstName && <p className="error-text">{errors.firstName}</p>}
                            </div>

                            <div className={"input-group" + (errors.lastName ? " input-error" : "")}>
                                <label htmlFor="contact-last-name">Nom</label>
                                <input
                                    className="input"
                                    type="text"
                                    id="contact-last-name"
                                    autoComplete="family-name"
                                    value={form.lastName}
                                    onChange={updateField("lastName")}
                                />
                                {errors.lastName && <p className="error-text">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div className={"input-group" + (errors.email ? " input-error" : "")}>
                            <label htmlFor="contact-email">Adresse mail</label>
                            <input
                                className="input"
                                type="email"
                                id="contact-email"
                                autoComplete="email"
                                placeholder="Pour que nous puissions vous répondre"
                                value={form.email}
                                onChange={updateField("email")}
                            />
                            {errors.email && <p className="error-text">{errors.email}</p>}
                        </div>

                        <div className={"input-group" + (errors.subject ? " input-error" : "")}>
                            <label htmlFor="contact-subject">Sujet</label>
                            <SubjectSelect
                                value={form.subject}
                                onChange={(subject) => {
                                    setForm((prev) => ({ ...prev, subject }));
                                    setErrors((prev) => ({ ...prev, subject: undefined }));
                                    if (status === "error") setStatus(null);
                                }}
                            />
                            {errors.subject && <p className="error-text">{errors.subject}</p>}
                        </div>

                        <div className={"input-group" + (errors.message ? " input-error" : "")}>
                            <label htmlFor="contact-message">Votre message</label>
                            <textarea
                                className="input contact-textarea"
                                id="contact-message"
                                rows={8}
                                maxLength={5000}
                                placeholder="Décrivez votre demande…"
                                value={form.message}
                                onChange={updateField("message")}
                            />
                            {errors.message && <p className="error-text">{errors.message}</p>}
                        </div>

                        <div className="contact-form-actions">
                            <Button type="submit" className="contact-submit" disabled={status === "sending"}>
                                {status === "sending" ? "Envoi en cours…" : <>Envoyer <LuSend size={15} /></>}
                            </Button>
                        </div>

                        {status === "sent" && (
                            <p className="contact-feedback contact-feedback-success" role="status">
                                Merci&nbsp;! Votre message a bien été envoyé, nous vous répondrons par e-mail.
                            </p>
                        )}
                        {status === "error" && (
                            <p className="contact-feedback contact-feedback-error" role="alert">
                                {errorMessage}
                            </p>
                        )}
                    </form>

                    <div className="legal-callout">
                        <p>
                            Vous préférez votre propre messagerie&nbsp;? Écrivez-nous à&nbsp;:{" "}
                            <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>
                        </p>
                    </div>

                    <h2>Objet de votre demande</h2>
                    <p>
                        Le menu déroulant «&nbsp;Sujet&nbsp;» nous permet d'orienter votre message vers la
                        bonne personne. Voici à quoi correspond chaque objet&nbsp;:
                    </p>
                    <ul>
                        <li>
                            <strong>Support et bugs</strong> — un problème technique, une erreur, un
                            comportement inattendu du site ou de l'application.
                        </li>
                        <li>
                            <strong>Suggestions</strong> — une idée, un retour d'expérience ou une amélioration
                            à proposer.
                        </li>
                        <li>
                            <strong>Données personnelles (RGPD)</strong> — pour exercer vos droits d'accès, de
                            rectification, d'effacement, de limitation, d'opposition ou de portabilité. Les
                            modalités sont détaillées dans notre{" "}
                            <Link to="/confidentialite">politique de confidentialité</Link>.
                        </li>
                        <li>
                            <strong>Signalement</strong> — pour nous signaler un contenu ou un usage
                            problématique.
                        </li>
                    </ul>

                    <h2>Délai de réponse</h2>
                    <p>
                        Sécu'Cycle étant un projet étudiant mené bénévolement, nous ne pouvons pas garantir de
                        délai de réponse. Nous faisons néanmoins de notre mieux pour répondre dans les meilleurs
                        délais.
                    </p>

                    <h2>Informations légales</h2>
                    <p>
                        Pour en savoir plus, consultez nos{" "}
                        <Link to="/mentions-legales">mentions légales</Link>, notre{" "}
                        <Link to="/confidentialite">politique de confidentialité</Link> et nos{" "}
                        <Link to="/conditions-utilisation">conditions générales d'utilisation</Link>.
                    </p>
                </article>
            </div>
        </>
    );
}
