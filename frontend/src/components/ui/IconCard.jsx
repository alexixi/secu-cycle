import './IconCard.css'

export default function IconCard({ key, iconPath, label, selected, onClick }) {
    return (
        <div id={key} className={`icon-card ${selected ? "selected" : ""}`} onClick={onClick}>
            <img className="icon-card-icon" src={`src/assets/${iconPath}`} alt={label} />
            <div className="icon-card-label">{label}</div>
        </div>
    );
}
