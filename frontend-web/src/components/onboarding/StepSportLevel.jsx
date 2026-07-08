import StepFooter from "./StepFooter";
import "../ui/Form.css";
import "./Onboarding.css";

const LEVELS = [
    { value: "debutant", label: "Débutant", description: "Je roule occasionnellement." },
    { value: "intermediaire", label: "Intermédiaire", description: "Je roule régulièrement." },
    { value: "experimente", label: "Expérimenté", description: "Je roule beaucoup et longtemps." },
];

export default function StepSportLevel({ level, setLevel, onNext, onSkip, isLoading }) {
    return (
        <div className="form onboarding-form">
            <h2>Votre niveau sportif</h2>
            <p className="onboarding-subtitle">Cette information est facultative.</p>

            <div className="onboarding-options">
                {LEVELS.map((lvl) => {
                    const selected = level === lvl.value;
                    return (
                        <button
                            key={lvl.value}
                            type="button"
                            className={`onboarding-option ${selected ? "selected" : ""}`}
                            onClick={() => setLevel(lvl.value)}
                        >
                            <span className="onboarding-option-label">{lvl.label}</span>
                            <span className="onboarding-option-description">{lvl.description}</span>
                        </button>
                    );
                })}
            </div>

            <StepFooter onNext={onNext} onSkip={onSkip} isLoading={isLoading} nextDisabled={!level} />
        </div>
    );
}
