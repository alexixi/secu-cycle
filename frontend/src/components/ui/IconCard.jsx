import './IconCard.css'

export default function IconCard({ id, IconSVG, label, selected, onClick }) {
    return (
        <div id={id} className={`icon-card ${selected ? "selected" : ""}`} onClick={onClick}>
            <IconSVG className="icon-card-icon" />
            <div className="icon-card-label">{label}</div>
        </div>
    );
}
