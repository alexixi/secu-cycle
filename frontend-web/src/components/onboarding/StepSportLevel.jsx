import { useTranslation } from "react-i18next";
import StepFooter from "./StepFooter";
import "../ui/Form.css";
import "./Onboarding.css";

const LEVELS = ["debutant", "intermediaire", "experimente"];

export default function StepSportLevel({ level, setLevel, onNext, onSkip, isLoading }) {
    const { t } = useTranslation('auth');
    return (
        <div className="form onboarding-form">
            <h2>{t('onboarding.niveau.h2')}</h2>
            <p className="onboarding-subtitle">{t('onboarding.facultatif')}</p>

            <div className="onboarding-options">
                {LEVELS.map((valeur) => {
                    const selected = level === valeur;
                    return (
                        <button
                            key={valeur}
                            type="button"
                            className={`onboarding-option ${selected ? "selected" : ""}`}
                            onClick={() => setLevel(valeur)}
                        >
                            <span className="onboarding-option-label">{t(`onboarding.niveau.${valeur}`)}</span>
                            <span className="onboarding-option-description">{t(`onboarding.niveau.${valeur}Description`)}</span>
                        </button>
                    );
                })}
            </div>

            <StepFooter onNext={onNext} onSkip={onSkip} isLoading={isLoading} nextDisabled={!level} />
        </div>
    );
}
