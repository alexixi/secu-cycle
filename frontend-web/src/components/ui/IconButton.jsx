import './IconButton.css';

export default function IconButton({ type, onClick, className, children }) {
    return (
        <button type={type} className={`icon-button ${className}`} onClick={onClick}>
            {children}
        </button>
    );
}

