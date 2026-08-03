import './ItinerariesSelect.css';

import { useState } from "react";
import { FaArrowTrendUp, FaArrowTrendDown, FaBicycle } from "react-icons/fa6";
import { PiPathBold } from "react-icons/pi";
import { MdOutlineTimer, MdOutlineSpeed, MdLightbulbOutline, MdInfoOutline, MdOutlineReportProblem, MdOutlineDarkMode, MdOutlineAir, MdOutlineWaterDrop, MdOutlineAir as MdWind, MdOutlineWarningAmber } from "react-icons/md";
import { weatherSummary } from "../../modules/map/weather";

import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

function buildSafetyExplanation(id, stats, weather) {
    if (!stats) return null;

    const points = [];

    if (stats.pct_cyclable >= 50) {
        points.push(`Plus de la moitié du trajet (${stats.pct_cyclable}%) emprunte des pistes ou bandes cyclables dédiées, séparées du trafic motorisé.`);
    } else if (stats.pct_cyclable >= 20) {
        points.push(`${stats.pct_cyclable}% du trajet utilise des infrastructures cyclables (piste, bande ou voie verte), limitant les interactions avec les voitures.`);
    } else {
        points.push(`Le trajet favorise les rues résidentielles et voies apaisées pour minimiser le trafic motorisé.`);
    }

    if (stats.pct_low_speed >= 60) {
        points.push(`${stats.pct_low_speed}% du trajet se déroule en zone ≤30 km/h, ce qui réduit significativement le risque et la gravité des accidents.`);
    } else if (stats.pct_low_speed >= 30) {
        points.push(`${stats.pct_low_speed}% du trajet passe par des zones à vitesse réduite (≤30 km/h).`);
    }

    if (stats.pct_lit >= 70) {
        points.push(`${stats.pct_lit}% du trajet est éclairé, assurant une bonne visibilité de nuit.`);
    }

    if (stats.accidents_count === 0) {
        points.push("Aucun accident à vélo n'a été officiellement recensé le long de ce trajet.");
    } else if (stats.accidents_count > 0) {
        points.push(`${stats.accidents_count} accident${stats.accidents_count > 1 ? 's' : ''} à vélo `
            + `${stats.accidents_count > 1 ? 'ont' : 'a'} été recensé${stats.accidents_count > 1 ? 's' : ''} `
            + `le long de ce trajet ; ces segments voient leur note de sécurité abaissée.`);
    }

    if (id === "safe") {
        points.push("Ce trajet a été sélectionné par l'algorithme comme le plus sécurisé parmi les options calculées, en privilégiant le score de sécurité sur la vitesse.");
    } else if (id === "compromise") {
        points.push("Ce trajet équilibre sécurité et durée : il reste dans le temps imparti tout en maximisant le passage sur des voies sécurisées.");
    }

    const summary = weatherSummary(weather);
    const bridges = summary?.ice_bridges;
    if (bridges?.count) {
        points.push(`Il fait ${Math.round(summary.temperature)} °C et ce trajet franchit `
            + `${bridges.count} pont${bridges.count > 1 ? 's' : ''} : un tablier perd sa chaleur `
            + `par ses deux faces et peut être verglacé alors que la chaussée voisine ne l'est pas.`);
    }
    for (const alert of (summary?.alerts || []).slice(0, 2)) {
        points.push(`${alert.label}${alert.at ? ` vers ${alert.at.slice(11, 16).replace(':', 'h')}` : ' en cours'} `
            + `sur la zone de départ. Cette information n'a pas modifié le tracé : à cette résolution `
            + `(~28 km), la météo vous avertit sans faire dévier l'itinéraire.`);
    }

    return points;
}

function SafetyInfo({ id, stats, weather }) {
    const [open, setOpen] = useState(false);
    const points = buildSafetyExplanation(id, stats, weather);
    if (!points) return null;

    return (
        <div className="safety-info-wrapper">
            <button
                className="safety-info-btn"
                onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
                title="Pourquoi ce trajet est-il sécurisé ?"
            >
                <MdInfoOutline />
            </button>
            {open && (
                <div className="safety-info-panel" onClick={e => e.stopPropagation()}>
                    <p className="safety-info-title">Pourquoi ce trajet est sécurisé ?</p>
                    <ul>
                        {points.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
}

function InfraStats({ stats, lightingAware, weather, route }) {
    if (!stats) return null;
    const summary = weatherSummary(weather);
    const headwind = route?.pct_headwind;
    const windEffect = route?.wind_effect_min;
    return (
        <div className="path-infra-stats">
            <span className="infra-badge badge-green">
                <FaBicycle /> {stats.pct_cyclable}% piste cyclable
            </span>
            <span className="infra-badge badge-blue">
                <MdOutlineSpeed /> {stats.pct_low_speed}% zone ≤30 km/h
            </span>
            <span
                className={`infra-badge ${lightingAware ? 'badge-yellow' : 'badge-muted'}`}
                title={lightingAware
                    ? "Il fait nuit : l'éclairage est pris en compte dans le calcul de cet itinéraire."
                    : "De jour (ou pendant la coupure nocturne), l'éclairage n'entre pas dans le calcul de l'itinéraire."}
            >
                <MdLightbulbOutline /> {stats.pct_lit}% éclairé
                {lightingAware && <MdOutlineDarkMode className="infra-badge-flag" />}
            </span>
            {stats.accidents_count > 0 && (
                <span className="infra-badge badge-red">
                    <MdOutlineReportProblem /> {stats.accidents_count} accident{stats.accidents_count > 1 ? 's' : ''} recensé{stats.accidents_count > 1 ? 's' : ''}
                </span>
            )}
            {stats.air_aware && (
                <span
                    className="infra-badge badge-teal"
                    title="L'air régional est dégradé : cet itinéraire privilégie les rues les plus à l'écart de la circulation, où l'exposition à la pollution est la plus faible."
                >
                    <MdOutlineAir /> {stats.pct_low_air_exposure}% à l'écart du trafic
                </span>
            )}
            {summary?.headwind_notable && headwind != null && (
                <span
                    className="infra-badge badge-cyan"
                    title={`Vent de ${Math.round(summary.wind?.speed ?? 0)} km/h. `
                        + `L'estimation de durée en tient compte, mais le tracé n'a pas été modifié.`}
                >
                    <MdWind /> Vent de face sur {Math.round(headwind)}%
                    {windEffect > 0 && ` · +${Math.round(windEffect)} min`}
                </span>
            )}
            {summary?.ice_bridges?.count > 0 && (
                <span
                    className="infra-badge badge-red"
                    title="Un tablier de pont perd sa chaleur par ses deux faces et gèle une à deux heures avant la chaussée voisine."
                >
                    <MdOutlineWarningAmber /> {summary.ice_bridges.count} pont{summary.ice_bridges.count > 1 ? 's' : ''} · risque de verglas
                </span>
            )}
        </div>
    );
}

function WeatherAdvice({ weather }) {
    const items = weatherSummary(weather)?.equipment;
    if (!items?.length) return null;
    return (
        <div className="weather-advice">
            <span className="weather-advice-title"><MdOutlineWaterDrop /> À prévoir</span>
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
    if (itineraires && itineraires.length > 0) {
        return (
            <div className="itineraries-select">
                <h3>Itinéraires disponibles</h3>
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
                                        <h3>{itineraire.name}</h3>
                                        <SafetyInfo id={itineraire.id} stats={itineraire.infra_stats} weather={weather} />
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
                                                    formatter={(value) => [`${value} m`, "Altitude"]}
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
