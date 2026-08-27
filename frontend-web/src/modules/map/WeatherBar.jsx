import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { MdNavigation, MdInfoOutline } from "react-icons/md";
import { WEATHER_ALERT_COLORS, weatherIcon, freshSteps } from "./weather";
import WeatherDetail from "./WeatherDetail";
import "./WeatherBar.css";

export default function WeatherBar({ zone, stale, ageMin, now, updatedAt, rain, onOpenInfo }) {
    const { t } = useTranslation('carte');
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
        const onPointerDown = (e) => {
            if (!rootRef.current?.contains(e.target)) setOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('mousedown', onPointerDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mousedown', onPointerDown);
        };
    }, [open]);

    const summary = zone?.summary;
    if (!summary) return null;

    const Icon = weatherIcon(summary.condition, summary.is_day !== false);
    const wind = summary.wind;
    const alerts = summary.alerts || [];
    const nowcast = freshSteps(zone.minutely_15, zone.utc_offset_seconds, undefined, now);
    const nowcastOutdated = (zone.minutely_15?.length > 0) && nowcast.length === 0;
    const gusty = wind?.gusts != null && wind.speed != null
        && wind.gusts >= wind.speed + 15;

    const notes = [];
    if (rain) notes.push({ key: 'rain', text: rain.text, level: 'watch' });
    for (const alert of alerts.slice(0, 2)) {
        notes.push({ key: alert.key, text: alert.label, level: alert.level });
    }
    const title = [
        summary.label,
        wind?.speed != null
            ? t('ui.meteo.ventTitre', { vitesse: Math.round(wind.speed) })
                + (wind.cardinal ? t('ui.meteo.ventDirection', { cardinal: wind.cardinal }) : '')
                + (gusty ? t('ui.meteo.rafalesTitre', { vitesse: Math.round(wind.gusts) }) : '')
            : null,
        stale && updatedAt ? t('ui.meteo.dernierReleveTitre', { heure: updatedAt }) : null,
        t(open ? 'ui.meteo.replier' : 'ui.meteo.detail'),
    ].filter(Boolean).join(' · ');

    return (
        <div
            ref={rootRef}
            className={`map-weather-bar${stale ? ' is-stale' : ''}${open ? ' is-open' : ''}`}
        >
            <button
                type="button"
                className="weather-bar-summary"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                title={title}
                aria-label={title}
            >
                <span className="weather-bar-main">
                    <Icon className="weather-bar-icon" aria-hidden="true" />
                    {summary.temperature != null && (
                        <span className="weather-bar-temp">{Math.round(summary.temperature)} °C</span>
                    )}
                    {wind?.speed != null && (
                        <span className="weather-bar-wind">
                            {wind.direction != null && (
                                <MdNavigation
                                    className="weather-bar-arrow"
                                    style={{ transform: `rotate(${wind.direction + 180}deg)` }}
                                    aria-hidden="true"
                                />
                            )}
                            {Math.round(wind.speed)} km/h
                            {gusty ? ` · rafales ${Math.round(wind.gusts)}` : ''}
                        </span>
                    )}
                </span>

                {notes.length > 0 && (
                    <span className="weather-bar-notes">
                        {notes.map((note) => (
                            <span
                                key={note.key}
                                className="weather-bar-note"
                                style={{ color: WEATHER_ALERT_COLORS[note.level] }}
                            >
                                {note.text}
                            </span>
                        ))}
                    </span>
                )}
            </button>
            <div className="weather-bar-detail-wrap" aria-hidden={!open}>
                <div>
                    <div className="weather-bar-detail" inert={!open}>
                        <div className="weather-bar-detail-head">
                            <span>{t('ui.meteo.titre')}</span>
                            <button
                                type="button"
                                className="weather-bar-info-btn"
                                onClick={onOpenInfo}
                                title={t('ui.meteo.sourcesTitre')}
                                aria-label={t('ui.meteo.sourcesAria')}
                            >
                                <MdInfoOutline />
                            </button>
                        </div>

                        <WeatherDetail
                            summary={summary}
                            hourly={zone.hourly || []}
                            minutely={nowcast}
                            outdated={nowcastOutdated}
                            ageMin={ageMin}
                            rain={rain}
                        />

                        {updatedAt && (
                            <p className="weather-bar-updated">
                                {t(stale ? 'ui.meteo.dernierReleveDispo' : 'ui.meteo.releveDe', { heure: updatedAt })}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
