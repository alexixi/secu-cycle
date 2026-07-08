import StepFooter from "./StepFooter";
import "../ui/Input.css";
import "../ui/Form.css";
import "./Onboarding.css";

export default function StepName({ firstName, setFirstName, lastName, setLastName, onNext, onSkip, isLoading }) {
    return (
        <div className="form onboarding-form">
            <h2>Comment vous appelez-vous&nbsp;?</h2>
            <p className="onboarding-subtitle">Cette information est facultative.</p>

            <div className="input-group">
                <label htmlFor="firstName">Prénom</label>
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
                <label htmlFor="lastName">Nom</label>
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
