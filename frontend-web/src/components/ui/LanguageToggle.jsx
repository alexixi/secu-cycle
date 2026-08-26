import { useLocation } from 'react-router';

import { LANGS, alternatesFor, langFromPathname } from '../../i18n/routes';
import './ThemeToggle.css';
import './LanguageToggle.css';

const LIBELLES = {
    fr: { court: 'FR', long: 'Français' },
    en: { court: 'EN', long: 'English' },
};

export default function LanguageToggle({ compact = false, className = '' }) {
    const { pathname, search } = useLocation();
    const courante = langFromPathname(pathname);
    const alternates = alternatesFor(pathname);

    if (LANGS.some((lang) => !alternates[lang])) return null;

    return (
        <div className={`theme-toggle lang-toggle ${compact ? 'theme-toggle-compact' : ''} ${className}`}>
            {LANGS.map((lang) => {
                const active = lang === courante;
                return (
                    <a
                        key={lang}
                        href={`${alternates[lang]}${search}`}
                        hrefLang={lang}
                        lang={lang}
                        rel={active ? undefined : 'alternate'}
                        className={`theme-toggle-btn ${active ? 'active' : ''}`}
                        aria-current={active ? 'true' : undefined}
                        title={LIBELLES[lang].long}
                    >
                        <span aria-hidden="true">{LIBELLES[lang].court}</span>
                        <span className="sr-only">{LIBELLES[lang].long}</span>
                    </a>
                );
            })}
        </div>
    );
}
