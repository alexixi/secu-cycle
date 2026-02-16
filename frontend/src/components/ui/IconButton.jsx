import './IconButton.css';

export default function IconButton({ onClick, className, children }) {
    return (
        <button className={`icon-button ${className}`} onClick={onClick}>
            {children}
        </button>
    );
}

