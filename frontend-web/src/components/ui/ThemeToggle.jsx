import { useTranslation } from "react-i18next";
import { LuSun, LuMonitor, LuMoon } from "react-icons/lu";
import './ThemeToggle.css';

// La clé de libellé plutôt que le mot : le sélecteur est rendu dans l'en-tête,
// donc sur toutes les pages, quelle que soit leur langue.
const OPTIONS = [
    { value: 'light', cle: 'clair', Icon: LuSun },
    { value: 'auto', cle: 'auto', Icon: LuMonitor },
    { value: 'dark', cle: 'sombre', Icon: LuMoon },
];

export default function ThemeToggle({ value, onChange, compact = false, className = '' }) {
    const { t } = useTranslation('common');
    return (
        <div className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''} ${className}`}>
            {OPTIONS.map(({ value: optValue, cle, Icon }) => (
                <button
                    key={optValue}
                    type="button"
                    className={`theme-toggle-btn ${value === optValue ? 'active' : ''}`}
                    onClick={() => onChange(optValue)}
                    title={t(`theme.${cle}`)}
                    aria-label={t(`theme.${cle}`)}
                    aria-pressed={value === optValue}
                >
                    <Icon size={18} />
                    {!compact && <span>{t(`theme.${cle}`)}</span>}
                </button>
            ))}
        </div>
    );
}
