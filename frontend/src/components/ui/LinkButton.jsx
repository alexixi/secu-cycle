import "./LinkButton.css";

export default function LinkButton({ to, className, children }) {
    return (
        <a href={to} className={`link-button ${className}`}>
            {children}
        </a>
    );
}