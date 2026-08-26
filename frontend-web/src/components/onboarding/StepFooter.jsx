import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import "./Onboarding.css";

export default function StepFooter({ onNext, onSkip, isLoading, nextTitle, nextDisabled = false }) {
    const { t } = useTranslation('auth');
    return (
        <div className="onboarding-footer">
            <Button type="button" className="active" onClick={onNext} disabled={isLoading || nextDisabled}>
                {isLoading ? t('onboarding.enregistrement') : (nextTitle ?? t('onboarding.continuer'))}
            </Button>
            <button type="button" className="onboarding-skip" onClick={onSkip} disabled={isLoading}>
                {t('onboarding.passerEtape')}
            </button>
        </div>
    );
}
