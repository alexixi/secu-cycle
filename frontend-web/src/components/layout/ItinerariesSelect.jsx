import { useTranslation } from "react-i18next";
import './ItinerariesSelect.css';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaArrowTrendUp, FaArrowTrendDown, FaBicycle } from "react-icons/fa6";
import { PiPathBold } from "react-icons/pi";
import { MdOutlineTimer, MdOutlineSpeed, MdLightbulbOutline, MdInfoOutline, MdClose, MdOutlineReportProblem, MdOutlineDarkMode, MdOutlineAir, MdOutlineWaterDrop, MdOutlineAir as MdWind, MdOutlineWarningAmber } from "react-icons/md";
import { weatherSummary, formatHM } from "../../modules/map/weather";
import useScrollFade from "../../hooks/useScrollFade";

import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

// `t` est passé en argument plutôt que lu par un hook : la fonction est appelée
// hors rendu et sert à composer une liste de phrases, pas du JSX.
function buildSafetyExplanation(t, id, stats, weather) {
    if (!stats) return null;

    const points = [];

    if (stats.pct_cyclable >= 50) {
        points.push(t('securite.cyclableFort', { pct: stats.pct_cyclable }));
    } else if (stats.pct_cyclable >= 20) {
        points.push(t('securite.cyclableMoyen', { pct: stats.pct_cyclable }));
    } else {
        points.push(t('securite.cyclableFaible'));
    }

    if (stats.pct_low_speed >= 60) {
        points.push(t('securite.lentFort', { pct: stats.pct_low_speed }));
    } else if (stats.pct_low_speed >= 30) {
        points.push(t('securite.lentMoyen', { pct: stats.pct_low_speed }));
    }

    if (stats.pct_lit >= 70) {
        points.push(t('securite.eclaire', { pct: stats.pct_lit }));
    }

    if (stats.accidents_count === 0) {
        points.push(t('securite.sansAccident'));
    } else if (stats.accidents_count > 0) {
        points.push(t('securite.accidents', { count: stats.accidents_count }));
    }

    if (id === "safe") {
        points.push(t('securite.varianteSafe'));
    } else if (id === "compromise") {
        points.push(t('securite.varianteCompromise'));
    }

    const summary = weatherSummary(weather);
    const bridges = summary?.ice_bridges;
    if (bridges?.count) {
        points.push(t('securite.ponts', {
            count: bridges.count,
            temperature: Math.round(summary.temperature),
        }));
    }
    for (const alert of (summary?.alerts || []).slice(0, 2)) {
        const quand = alert.at
            ? t('securite.alerteVers', { heure: formatHM(alert.at) })
            : t('securite.alerteEnCours');
        points.push(t('securite.alerte', { libelle: alert.label, quand }));
    }

    return points;
}

const MARGE_ECRAN = 8;
const ECART_BOUTON = 6;

function SafetyInfo({ id, stats, weather, open, onToggle, onClose }) {
    const { t } = useTranslation('itineraire');
    const btnRef = useRef(null);
    const panelRef = useRef(null);
    const [pos, setPos] = useState(null);
    const points = buildSafetyExplanation(t, id, stats, weather);

    useLayoutEffect(() => {
        if (!open) {
            setPos(null);
            return;
        }

        const placer = () => {
            const bouton = btnRef.current;
            const panneau = panelRef.current;
            if (!bouton || !panneau) return;

            const ancre = bouton.getBoundingClientRect();
            const { width, height } = panneau.getBoundingClientRect();

            const gaucheMax = window.innerWidth - width - MARGE_ECRAN;
            const left = Math.max(MARGE_ECRAN, Math.min(ancre.left, gaucheMax));

            const dessous = ancre.bottom + ECART_BOUTON;
            const auDessus = dessous + height > window.innerHeight - MARGE_ECRAN
                && ancre.top - height - ECART_BOUTON >= MARGE_ECRAN;

            setPos({
                top: auDessus ? ancre.top - height - ECART_BOUTON : dessous,
                left,
                auDessus,
                fleche: ancre.left + ancre.width / 2 - left,
            });
        };

        placer();
        window.addEventListener('resize', placer);
        window.addEventListener('scroll', placer, true);
        return () => {
            window.removeEventListener('resize', placer);
            window.removeEventListener('scroll', placer, true);
        };
    }, [open, points?.length]);

    useEffect(() => {
        if (!open) return;

        const surTouche = (e) => {
            if (e.key !== 'Escape') return;
            onClose();
            btnRef.current?.focus();
        };
        const surClic = (e) => {
            if (btnRef.current?.contains(e.target)) return;
            if (panelRef.current?.contains(e.target)) return;
            onClose();
        };

        const vigie = new IntersectionObserver(
            ([entree]) => { if (!entree.isIntersecting) onClose(); },
            { threshold: 0 },
        );
        if (btnRef.current) vigie.observe(btnRef.current);

        document.addEventListener('keydown', surTouche);
        document.addEventListener('mousedown', surClic);
        return () => {
            vigie.disconnect();
            document.removeEventListener('keydown', surTouche);
            document.removeEventListener('mousedown', surClic);
        };
    }, [open, onClose]);

    if (!points) return null;

    return (
        <div className="safety-info-wrapper">
            <button
                ref={btnRef}
                type="button"
                className="safety-info-btn"
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                title={t('securite.bouton')}
                aria-label={t('securite.bouton')}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <MdInfoOutline />
            </button>
            {open && createPortal(
                <div
                    ref={panelRef}
                    className={`safety-info-panel${pos?.auDessus ? ' is-above' : ''}`}
                    role="dialog"
                    aria-label={t('securite.titre')}
                    onClick={e => e.stopPropagation()}
                    style={pos
                        ? { top: pos.top, left: pos.left, '--fleche-x': `${pos.fleche}px` }
                        : { top: 0, left: 0, visibility: 'hidden' }}
                >
                    <div className="safety-info-head">
                        <p className="safety-info-title">{t('securite.titre')}</p>
                        <button
                            type="button"
                            className="safety-info-close"
                            onClick={() => { onClose(); btnRef.current?.focus(); }}
                            title={t('securite.fermer')}
                            aria-label={t('securite.fermer')}
                        >
                            <MdClose />
                        </button>
                    </div>
                    <ul>
                        {points.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                </div>,
                document.body,
            )}
        </div>
    );
}

function InfraStats({ stats, lightingAware, weather, route }) {
    const { t } = useTranslation('itineraire');
    const { ref, scrollState, checkScroll, scrollProps } = useScrollFade();
    const summary = weatherSummary(weather);
    const headwind = route?.pct_headwind;
    const windEffect = route?.wind_effect_min;

    const badgesConditionnels = [
        stats?.accidents_count > 0,
        stats?.air_aware,
        summary?.headwind_notable && headwind != null,
        summary?.ice_bridges?.count > 0,
    ].join();
    useEffect(() => { checkScroll(); }, [checkScroll, badgesConditionnels]);

    if (!stats) return null;

    return (
        <div
            ref={ref}
            className="path-infra-stats"
            data-scroll={scrollState}
            tabIndex={0}
            {...scrollProps}
        >
            <span className="infra-badge badge-green">
                <FaBicycle /> {t('badges.pisteCyclable', { pct: stats.pct_cyclable })}
            </span>
            <span className="infra-badge badge-blue">
                <MdOutlineSpeed /> {t('badges.zoneLente', { pct: stats.pct_low_speed })}
            </span>
            <span
                className={`infra-badge ${lightingAware ? 'badge-yellow' : 'badge-muted'}`}
                title={t(lightingAware ? 'badges.eclairageActif' : 'badges.eclairageInactif')}
            >
                <MdLightbulbOutline /> {t('badges.eclaire', { pct: stats.pct_lit })}
                {lightingAware && <MdOutlineDarkMode className="infra-badge-flag" />}
            </span>
            {stats.accidents_count > 0 && (
                <span className="infra-badge badge-red">
                    <MdOutlineReportProblem /> {t('badges.accidents', { count: stats.accidents_count })}
                </span>
            )}
            {stats.air_aware && (
                <span
                    className="infra-badge badge-teal"
                    title={t('badges.airDegrade')}
                >
                    <MdOutlineAir /> {t('badges.horsTrafic', { pct: stats.pct_low_air_exposure })}
                </span>
            )}
            {summary?.headwind_notable && headwind != null && (
                <span
                    className="infra-badge badge-cyan"
                    title={t('badges.ventTitre', { vitesse: Math.round(summary.wind?.speed ?? 0) })}
                >
                    <MdWind /> {t('badges.ventDeFace', { pct: Math.round(headwind) })}
                    {windEffect > 0 && t('badges.ventMinutes', { minutes: Math.round(windEffect) })}
                </span>
            )}
            {summary?.ice_bridges?.count > 0 && (
                <span
                    className="infra-badge badge-red"
                    title={t('badges.pontsTitre')}
                >
                    <MdOutlineWarningAmber /> {t('badges.ponts', { count: summary.ice_bridges.count })}
                </span>
            )}
        </div>
    );
}

function WeatherAdvice({ weather }) {
    const { t } = useTranslation('carte');
    const items = weatherSummary(weather)?.equipment;
    if (!items?.length) return null;
    return (
        <div className="weather-advice">
            <span className="weather-advice-title"><MdOutlineWaterDrop /> {t('ui.meteo.aPrevoir')}</span>
            <div className="weather-advice-chips">
                {items.map((item) => (
                    <span key={item.key} className="weather-advice-chip" title={item.reason}>
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function ItinerariesSelect({ itineraires, weather, selectedItineraire, setSelectedItineraire }) {
    const { t } = useTranslation('itineraire');
    const [infoOuverte, setInfoOuverte] = useState(null);
    const fermerInfo = useCallback(() => setInfoOuverte(null), []);
    useEffect(() => { setInfoOuverte(null); }, [selectedItineraire]);
    // Le backend renvoie encore le nom de la variante en français (`Rapide`,
    // `Sécurisé`, `Compromis`). L'`id`, lui, est une clé stable : on résout le
    // libellé ici, et on ne retombe sur le nom de l'API que pour une variante
    // qu'on ne connaîtrait pas.
    const nomVariante = (itineraire) => {
        const cle = `itineraires.nom.${itineraire.id}`;
        const libelle = t(cle);
        return libelle === cle ? itineraire.name : libelle;
    };
    if (itineraires && itineraires.length > 0) {
        return (
            <div className="itineraries-select">
                <h3>{t('itineraires.titre')}</h3>
                <div className='path-container'>
                    {itineraires.map((itineraire) => {
                        const isSelected = selectedItineraire === itineraire.id;
                        const elevationData = (itineraire.path && itineraire.path.length > 0 && isSelected)
                            ? itineraire.path.map(point => ({ elevation: point[2] }))
                            : [];
                        return (
                            <div
                                key={itineraire.id}
                                className={isSelected ? "path path-selected" : "path"}
                                onClick={() => setSelectedItineraire(itineraire.id)}
                            >
                                <div className="path-top">
                                    <div className="path-title-row">
                                        <h3>{nomVariante(itineraire)}</h3>
                                        <SafetyInfo
                                            id={itineraire.id}
                                            stats={itineraire.infra_stats}
                                            weather={weather}
                                            open={infoOuverte === itineraire.id}
                                            onToggle={() => setInfoOuverte(o => (o === itineraire.id ? null : itineraire.id))}
                                            onClose={fermerInfo}
                                        />
                                    </div>
                                    <div className='path-info'>
                                        <span className='color-red'><FaArrowTrendUp /> {itineraire.height_difference[0]} m</span>
                                        <span className='color-green'><FaArrowTrendDown /> {itineraire.height_difference[1]} m</span>
                                        <span><PiPathBold /> {itineraire.distance.toFixed(2)} km</span>
                                        <span><MdOutlineTimer /> {Math.round(itineraire.duration)} min</span>
                                    </div>
                                </div>
                                {isSelected && (
                                    <InfraStats
                                        stats={itineraire.infra_stats}
                                        lightingAware={itineraire.lighting_aware}
                                        weather={weather}
                                        route={itineraire}
                                    />
                                )}
                                {isSelected && <WeatherAdvice weather={weather} />}
                                {elevationData.length > 0 && (
                                    <div className="path-elevation">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={elevationData}>
                                                <YAxis hide domain={['dataMin', 'dataMax']} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--bg-surface)',
                                                        border: '1px solid var(--primary)',
                                                        borderRadius: '8px',
                                                        padding: '4px 8px',
                                                        fontSize: '0.80em',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                                                    }}
                                                    itemStyle={{ color: 'var(--text-main)', margin: 0, fontWeight: 'bold' }}
                                                    labelFormatter={() => ""}
                                                    formatter={(value) => [`${value} m`, t('itineraires.altitude')]}
                                                    wrapperStyle={{ outline: 'none' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="elevation"
                                                    stroke="var(--primary)"
                                                    fill="var(--primary)"
                                                    fillOpacity={0.2}
                                                    isAnimationActive={true}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}
