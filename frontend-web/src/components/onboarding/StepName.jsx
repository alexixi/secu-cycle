import { useTranslation } from "react-i18next";
import StepFooter from "./StepFooter";
import "../ui/Input.css";
import "../ui/Form.css";
import "./Onboarding.css";

export default function StepName({ firstName, setFirstName, lastName, setLastName, onNext, onSkip, isLoading }) {
    const { t } = useTranslation('auth');
    return (
        <div className="form onboarding-form">
            <h2>{t('onboarding.nom.h2')}</h2>
            <p className="onboarding-subtitle">{t('onboarding.facultatif')}</p>

            <div className="input-group">
                <label htmlFor="firstName">{t('champs.prenom')}</label>
                <input
                    className="input"
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="input-group">
                <label htmlFor="lastName">{t('champs.nom')}</label>
                <input
                    className="input"
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />
            </div>

            <StepFooter onNext={onNext} onSkip={onSkip} isLoading={isLoading} />
        </div>
    );
}
