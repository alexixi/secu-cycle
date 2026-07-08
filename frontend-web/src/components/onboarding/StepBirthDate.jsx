import StepFooter from "./StepFooter";
import "../ui/Input.css";
import "../ui/Form.css";
import "./Onboarding.css";

const MIN_AGE = 15;

const computeAge = (dateStr) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age -= 1;
    }
    return age;
};

export default function StepBirthDate({ birthDate, setBirthDate, onNext, onSkip, isLoading }) {
    const age = birthDate ? computeAge(birthDate) : null;
    const tooYoung = age !== null && age < MIN_AGE;

    const todayStr = new Date().toISOString().split("T")[0];

    return (
        <div className="form onboarding-form">
            <h2>Votre date de naissance</h2>
            <p className="onboarding-subtitle">Cette information est facultative.</p>

            <div className={`input-group ${tooYoung ? "input-error" : ""}`}>
                <label htmlFor="birthdate">Date de naissance</label>
                <input
                    className="input"
                    type="date"
                    id="birthdate"
                    value={birthDate}
                    max={todayStr}
                    onChange={(e) => setBirthDate(e.target.value)}
                    autoFocus
                />
                {tooYoung && (
                    <div className="error-text">
                        Vous devez avoir au moins {MIN_AGE} ans pour utiliser l&apos;application.
                    </div>
                )}
            </div>

            <StepFooter onNext={onNext} onSkip={onSkip} isLoading={isLoading} nextDisabled={!birthDate || tooYoung} />
        </div>
    );
}
