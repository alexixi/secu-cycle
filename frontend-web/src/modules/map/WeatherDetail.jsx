import { useTranslation } from "react-i18next";
import { MdNavigation } from "react-icons/md";
import {
    WEATHER_ALERT_COLORS, weatherIcon, formatHM, formatHMShifted,
    precipBarHeight, PRECIP_FULL_BAR_MM, MINUTELY_STEP_MIN,
} from "./weather";

export default function WeatherDetail({ summary, hourly = [], minutely = [], outdated = false, rain }) {
    const { t } = useTranslation('carte');
    const wind = summary.wind;
    const alerts = summary.alerts || [];
    const equipment = summary.equipment || [];

    const feels = summary.apparent_temperature;
    const showFeels = feels != null && summary.temperature != null
        && Math.abs(feels - summary.temperature) >= 1;

    const hasNowcast = minutely.length > 0;
    const nextHours = hourly.slice(0, 12);

    return (
        <div className="weather-detail">
            <section className="weather-detail-now">
                <span className="weather-detail-now-temp">
                    {summary.temperature != null ? `${Math.round(summary.temperature)} °C` : '—'}
                </span>
                <span className="weather-detail-now-text">
                    <span className="weather-detail-now-label">{summary.label}</span>
                    {showFeels && (
                        <span className="weather-detail-muted">
                            Ressenti {Math.round(feels)} °C
                        </span>
                    )}
                </span>
            </section>

            <section className="weather-detail-block">
                <h4>{t('ui.meteo.precipitations')}</h4>
                {rain && <p className="weather-detail-lead">{rain.text}</p>}

                {hasNowcast ? (
                    <>
                        <div className="weather-precip-chart" aria-hidden="true">
                            {minutely.map((step) => (
                                <span key={step.time} className="weather-precip-slot">
                                    <span
                                        className="weather-precip-bar"
                                        style={{ height: `${precipBarHeight(step.precipitation) * 100}%` }}
                                    />
                                </span>
                            ))}
                        </div>
                        <div className="weather-precip-axis">
                            <span>{formatHM(minutely[0].time)}</span>
                            <span className="weather-detail-muted">
                                {t('ui.meteo.echelle', { mm: PRECIP_FULL_BAR_MM, minutes: MINUTELY_STEP_MIN })}
                            </span>
                            <span>
                                {formatHMShifted(minutely[minutely.length - 1].time, MINUTELY_STEP_MIN)}
                            </span>
                        </div>
                        <p className="weather-detail-muted">
                            {t('ui.meteo.cumulPeriode', {
                                mm: minutely.reduce((sum, s) => sum + (s.precipitation || 0), 0).toFixed(1),
                            })}
                        </p>
                    </>
                ) : outdated ? (
                    <p className="weather-detail-muted">
                        {t('ui.meteo.nowcastExpire')}
                    </p>
                ) : (
                    <p className="weather-detail-muted">
                        {t('ui.meteo.nowcastHorsZone')}
                    </p>
                )}

                {nextHours.length > 0 && (
                    <ul className="weather-precip-hours">
                        {nextHours.slice(0, 6).map((h) => (
                            <li key={h.time}>
                                <span>{formatHM(h.time)}</span>
                                <span className={h.precipitation_probability >= 50 ? 'is-likely' : ''}>
                                    {h.precipitation_probability != null
                                        ? `${h.precipitation_probability} %` : '—'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {wind?.speed != null && (
                <section className="weather-detail-block">
                    <h4>{t('ui.meteo.vent')}</h4>
                    <p className="weather-detail-wind">
                        {wind.direction != null && (
                            <MdNavigation
                                className="weather-detail-arrow"
                                style={{ transform: `rotate(${wind.direction + 180}deg)` }}
                                aria-hidden="true"
                            />
                        )}
                        <strong>{Math.round(wind.speed)} km/h</strong>
                        {wind.cardinal && (
                            <span className="weather-detail-muted">{t('ui.meteo.ventDe', { cardinal: wind.cardinal })}</span>
                        )}
                    </p>
                    {wind.gusts != null && (
                        <p className="weather-detail-muted">
                            {t('ui.meteo.rafales', { vitesse: Math.round(wind.gusts) })}
                        </p>
                    )}
                </section>
            )}

            <section className="weather-detail-block">
                <h4>{t('ui.meteo.vigilance')}</h4>
                {alerts.length === 0 ? (
                    <p className="weather-detail-muted">{t('ui.meteo.rienASignaler')}</p>
                ) : (
                    <ul className="weather-detail-alerts">
                        {alerts.map((alert) => (
                            <li key={alert.key}>
                                <span
                                    className="weather-detail-dot"
                                    style={{ backgroundColor: WEATHER_ALERT_COLORS[alert.level] }}
                                />
                                <span>
                                    {alert.label}
                                    {alert.at && ` vers ${formatHM(alert.at)}`}
                                    {alert.official && alert.source && (
                                        <span className="weather-detail-muted">{` · ${alert.source}`}</span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {equipment.length > 0 && (
                <section className="weather-detail-block">
                    <h4>{t('ui.meteo.aPrevoir')}</h4>
                    <div className="weather-detail-chips">
                        {equipment.map((item) => (
                            <span key={item.key} className="weather-detail-chip" title={item.reason}>
                                {item.label}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {nextHours.length > 0 && (
                <section className="weather-detail-block">
                    <h4>{t('ui.meteo.prochainesHeures')}</h4>
                    <div className="weather-detail-hours">
                        {nextHours.map((h) => {
                            const Icon = weatherIcon(h.condition, h.is_day !== false);
                            return (
                                <span key={h.time} className="weather-detail-hour" title={h.label}>
                                    <span className="weather-detail-muted">{formatHM(h.time)}</span>
                                    <Icon aria-hidden="true" />
                                    <span>{h.temperature != null ? `${Math.round(h.temperature)}°` : '—'}</span>
                                </span>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
