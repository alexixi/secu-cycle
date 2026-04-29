import './ItinerariesSelect.css';

import { useState } from "react";
import { FaArrowTrendUp, FaArrowTrendDown, FaBicycle } from "react-icons/fa6";
import { PiPathBold } from "react-icons/pi";
import { MdOutlineTimer, MdOutlineSpeed, MdLightbulbOutline, MdInfoOutline } from "react-icons/md";

import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

function buildSafetyExplanation(id, stats) {
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

    if (id === "safe") {
        points.push("Ce trajet a été sélectionné par l'algorithme comme le plus sécurisé parmi les options calculées, en privilégiant le score de sécurité sur la vitesse.");
    } else if (id === "compromise") {
        points.push("Ce trajet équilibre sécurité et durée : il reste dans le temps imparti tout en maximisant le passage sur des voies sécurisées.");
    }

    return points;
}

function SafetyInfo({ id, stats }) {
    const [open, setOpen] = useState(false);
    const points = buildSafetyExplanation(id, stats);
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

function InfraStats({ stats }) {
    if (!stats) return null;
    return (
        <div className="path-infra-stats">
            <span className="infra-badge badge-green">
                <FaBicycle /> {stats.pct_cyclable}% piste cyclable
            </span>
            <span className="infra-badge badge-blue">
                <MdOutlineSpeed /> {stats.pct_low_speed}% zone ≤30 km/h
            </span>
            <span className="infra-badge badge-yellow">
                <MdLightbulbOutline /> {stats.pct_lit}% éclairé
            </span>
        </div>
    );
}

export default function ItinerariesSelect({ itineraires, selectedItineraire, setSelectedItineraire }) {
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
                                        <SafetyInfo id={itineraire.id} stats={itineraire.infra_stats} />
                                    </div>
                                    <div className='path-info'>
                                        <span className='color-red'><FaArrowTrendUp /> {itineraire.height_difference[0]} m</span>
                                        <span className='color-green'><FaArrowTrendDown /> {itineraire.height_difference[1]} m</span>
                                        <span><PiPathBold /> {itineraire.distance.toFixed(2)} km</span>
                                        <span><MdOutlineTimer /> {Math.round(itineraire.duration)} min</span>
                                    </div>
                                </div>
                                {isSelected && (
                                    <InfraStats stats={itineraire.infra_stats} />
                                )}
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
