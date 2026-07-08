import Button from "../ui/Button";
import "./Onboarding.css";

export default function StepFooter({ onNext, onSkip, isLoading, nextTitle = "Continuer", nextDisabled = false }) {
    return (
        <div className="onboarding-footer">
            <Button type="button" className="active" onClick={onNext} disabled={isLoading || nextDisabled}>
                {isLoading ? "Enregistrement…" : nextTitle}
            </Button>
            <button type="button" className="onboarding-skip" onClick={onSkip} disabled={isLoading}>
                Passer cette étape
            </button>
        </div>
    );
}
