import "./Button.css";

export default function LinkButton({ to, className, children }) {
    return (
        <a href={to} className={`button ${className}`}>
            {children}
        </a>
    );
}
