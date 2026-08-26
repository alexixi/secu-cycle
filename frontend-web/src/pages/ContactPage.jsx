import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import Meta from "../components/Meta";
import Button from "../components/ui/Button";
import { sendContactMessage } from "../services/apiBack";
import { trackEvent } from "../services/analytics";
import { LuSend, LuChevronDown, LuCheck } from "react-icons/lu";
import "../components/ui/Input.css";
import "../components/ui/Form.css";
import "./legal.css";
import { useLocalizedPath } from '../i18n/useLang';

const EMPTY_FORM = { firstName: "", lastName: "", email: "", subject: "", message: "" };

const SUBJECT_KEYS = ["support", "suggestions", "rgpd", "signalement", "autre"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form, t, sujetsValides) {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = t("contact.validation.prenom");
    if (!form.lastName.trim()) errors.lastName = t("contact.validation.nom");
    if (!EMAIL_REGEX.test(form.email.trim())) errors.email = t("contact.validation.email");
    if (!sujetsValides.includes(form.subject)) errors.subject = t("contact.validation.sujet");
    if (form.message.trim().length < 10) errors.message = t("contact.validation.message");
    return errors;
}

/** Menu déroulant maison : les <option> natives sont rendues par l'OS et ne se stylent pas. */
function SubjectSelect({ value, onChange, sujets, placeholder }) {
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
                if (open) select(sujets[activeIndex]);
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
                setActiveIndex((i) => (i + step + sujets.length) % sujets.length);
                break;
            }
            default:
                break;
        }
    };

    const openMenu = () => {
        const selectedIndex = sujets.indexOf(value);
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
                <span>{value || placeholder}</span>
                <LuChevronDown
                    className={"contact-select-chevron" + (open ? " contact-select-chevron-open" : "")}
                    size={18}
                />
            </button>

            {open && (
                <ul className="contact-options" role="listbox" aria-labelledby="contact-subject">
                    {sujets.map((subject, index) => (
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
    const { t } = useTranslation('legal');
    const path = useLocalizedPath();

    const sujets = SUBJECT_KEYS.map((cle) => t(`contact.sujets.${cle}`));

    const composants = {
        b: <strong />,
        mail: <a href="mailto:contact@secu-cycle.fr" />,
        confidentialite: <Link to={path("confidentialite")} />,
        suppression: <Link to={path("suppressionCompte")} />,
        mentions: <Link to={path("mentionsLegales")} />,
        conditions: <Link to={path("conditions")} />,
    };
    const T = ({ k }) => <Trans t={t} i18nKey={k} components={composants} />;
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
        const validationErrors = validate(form, t, sujets);
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
                    ? t('contact.formulaire.erreurLimite')
                    : t('contact.formulaire.erreurEnvoi'),
            );
            setStatus("error");
        }
    };

    return (
        <>
            <Meta
                title={t('contact.titrePage')}
                description={t('contact.metaDescription')}
            />
            <div className="legal-page">
                <article className="legal-content">
                    <h1>{t('contact.h1')}</h1>

                    <p><T k="contact.chapo" /></p>

                    <h2>{t('contact.formulaire.h2')}</h2>
                    <p><T k="contact.formulaire.intro" /></p>

                    <form className="contact-form" onSubmit={handleSubmit} noValidate>
                        <div className="contact-form-row">
                            <div className={"input-group" + (errors.firstName ? " input-error" : "")}>
                                <label htmlFor="contact-first-name">{t('contact.formulaire.prenom')}</label>
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
                                <label htmlFor="contact-last-name">{t('contact.formulaire.nom')}</label>
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
                            <label htmlFor="contact-email">{t('contact.formulaire.email')}</label>
                            <input
                                className="input"
                                type="email"
                                id="contact-email"
                                autoComplete="email"
                                placeholder={t('contact.formulaire.emailPlaceholder')}
                                value={form.email}
                                onChange={updateField("email")}
                            />
                            {errors.email && <p className="error-text">{errors.email}</p>}
                        </div>

                        <div className={"input-group" + (errors.subject ? " input-error" : "")}>
                            <label htmlFor="contact-subject">{t('contact.formulaire.sujet')}</label>
                            <SubjectSelect
                                sujets={sujets}
                                placeholder={t('contact.formulaire.sujetPlaceholder')}
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
                            <label htmlFor="contact-message">{t('contact.formulaire.message')}</label>
                            <textarea
                                className="input contact-textarea"
                                id="contact-message"
                                rows={8}
                                maxLength={5000}
                                placeholder={t('contact.formulaire.messagePlaceholder')}
                                value={form.message}
                                onChange={updateField("message")}
                            />
                            {errors.message && <p className="error-text">{errors.message}</p>}
                        </div>

                        <div className="contact-form-actions">
                            <Button type="submit" className="contact-submit" disabled={status === "sending"}>
                                {status === "sending" ? t('contact.formulaire.envoiEnCours') : <>{t('contact.formulaire.envoyer')} <LuSend size={15} /></>}
                            </Button>
                        </div>

                        {status === "sent" && (
                            <p className="contact-feedback contact-feedback-success" role="status">
                                <T k="contact.formulaire.succes" />
                            </p>
                        )}
                        {status === "error" && (
                            <p className="contact-feedback contact-feedback-error" role="alert">
                                {errorMessage}
                            </p>
                        )}
                    </form>

                    <div className="legal-callout">
                        <p><T k="contact.mailDirect" /></p>
                    </div>

                    <h2>{t('contact.objets.h2')}</h2>
                    <p><T k="contact.objets.intro" /></p>
                    <ul>
                        <li><T k="contact.objets.support" /></li>
                        <li><T k="contact.objets.suggestions" /></li>
                        <li><T k="contact.objets.rgpd" /></li>
                        <li><T k="contact.objets.signalement" /></li>
                    </ul>

                    <h2>{t('contact.delai.h2')}</h2>
                    <p><T k="contact.delai.texte" /></p>

                    <h2>{t('contact.infosLegales.h2')}</h2>
                    <p><T k="contact.infosLegales.texte" /></p>
                </article>
            </div>
        </>
    );
}
