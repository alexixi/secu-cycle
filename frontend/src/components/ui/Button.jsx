import "./Button.css";

export default function Button({ onClick, className, disabled, children }) {
    return (
        <button className={`button ${className}`} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    );
}
