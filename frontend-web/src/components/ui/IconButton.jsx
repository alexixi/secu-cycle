import './IconButton.css';

export default function IconButton({ type, onClick, className, children, ...rest }) {
    return (
        <button type={type} className={`icon-button ${className}`} onClick={onClick} {...rest}>
            {children}
        </button>
    );
}

