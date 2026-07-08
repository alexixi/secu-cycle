import "./Onboarding.css";

export default function OnboardingProgress({ current, total }) {
    return (
        <div className="onboarding-progress" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`onboarding-progress-segment ${i <= current ? "filled" : ""}`}
                />
            ))}
        </div>
    );
}
