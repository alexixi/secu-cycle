import "./Button.css";

export default function Button({ onClick, type, className, disabled, children }) {
    return (
        <button type={type} className={`button ${className}`} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    );
}
