import './ItinerariesSelect.css';

import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { PiPathBold } from "react-icons/pi";
import { MdOutlineTimer } from "react-icons/md";

import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

export default function ItinerariesSelect({ itineraires, selectedItineraire, setSelectedItineraire }) {
    if (itineraires && itineraires.length > 0) {
        return (
            <div className="itineraries-select">
                <h3>Itinéraires disponibles</h3>
                <div className='path-container'>
                    {itineraires.map((itineraire) => {
                        const elevationData = (itineraire.path && itineraire.path.length > 0 && selectedItineraire === itineraire.id) ? itineraire.path.map(point => ({
                            elevation: point[2]
                        })) : [];
                        return (
                            <div
                                key={itineraire.id}
                                className={selectedItineraire === itineraire.id ? "path path-selected" : "path"}
                                onClick={() => setSelectedItineraire(itineraire.id)}
                            >
                                <div className="path-top">
                                    <h3>{itineraire.name}</h3>
                                    <div className='path-info'>
                                        {console.log(itineraire)}
                                        <span className='color-red'><FaArrowTrendUp /> {itineraire.height_difference[0]} m</span>
                                        <span className='color-green'><FaArrowTrendDown /> {itineraire.height_difference[1]} m</span>
                                        <span><PiPathBold /> {itineraire.distance.toFixed(2)} km</span>
                                        <span><MdOutlineTimer /> {Math.round(itineraire.duration)} min</span>
                                    </div>
                                </div>
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
                                )
                                }
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }
}
