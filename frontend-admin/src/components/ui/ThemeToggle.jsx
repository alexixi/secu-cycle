import { LuSun, LuMonitor, LuMoon } from "react-icons/lu";
import './ThemeToggle.css';

const OPTIONS = [
    { value: 'light', label: 'Clair', Icon: LuSun },
    { value: 'auto', label: 'Auto', Icon: LuMonitor },
    { value: 'dark', label: 'Sombre', Icon: LuMoon },
];

export default function ThemeToggle({ value, onChange, compact = false, className = '' }) {
    return (
        <div className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''} ${className}`}>
            {OPTIONS.map(({ value: optValue, label, Icon }) => (
                <button
                    key={optValue}
                    type="button"
                    className={`theme-toggle-btn ${value === optValue ? 'active' : ''}`}
                    onClick={() => onChange(optValue)}
                    title={label}
                    aria-label={label}
                    aria-pressed={value === optValue}
                >
                    <Icon size={18} />
                    {!compact && <span>{label}</span>}
                </button>
            ))}
        </div>
    );
}
