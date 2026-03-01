import './IconCard.css'

export default function IconCard({ id, IconSVG, label, LabelIcon = null, selected, onClick, context }) {
    return (
        <div id={id} className={`icon-card ${selected ? "selected" : ""}`} onClick={onClick}>
            <IconSVG className="icon-card-icon" />
            <div className="icon-card-label">{label}{LabelIcon}</div>
            {/* {context==""? "" : <div className="icon-card-context">{context}</div>} */}
        </div>
    );
}
