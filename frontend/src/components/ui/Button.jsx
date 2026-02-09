import "./Button.css";

export default function Button({ onClick, className, children }) {
    return (
        <button className={`button ${className}`} onClick={onClick}>
            {children}
        </button>
    );
}