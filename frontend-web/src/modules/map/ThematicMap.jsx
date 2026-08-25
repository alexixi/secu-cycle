import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FaLayerGroup } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { trackEvent } from '../../services/analytics';
import { legendLabel, themeLabel } from '../../i18n/carteLabels';
import {
    getPois, getAccidents, getStreetlights, getLitRoads, getBikeshareStations, getTraffic,
} from '../../services/apiBack';
import {
    mapStyleUrl, MAP_STYLES,
    POI_IMAGE_ASSETS, BIKESHARE_IMAGE_ASSETS,
    POI_CATEGORIES, POI_DETAIL_FIELDS, formatPoiTag, poiIconSrc, poiAccentColor,
    POI_LAYER_ID, POI_LAYER_LAYOUT, poiLayerPaint,
    LIGHTING_HEAT_LAYER_ID, LIT_ROADS_GLOW_LAYER_ID, LIT_ROADS_LINE_LAYER_ID,
    LIGHTING_HEATMAP_PAINT, LIT_ROADS_GLOW_PAINT, LIT_ROADS_LINE_PAINT,
    ACCIDENT_HEAT_LAYER_ID, ACCIDENT_POINT_LAYER_ID, ACCIDENT_SWITCH_ZOOM,
    ACCIDENT_HEAT_PAINT, ACCIDENT_POINT_PAINT, ACCIDENT_DETAIL_FIELDS, formatAccidentDate,
    TRAFFIC_LAYER_ID, TRAFFIC_HITBOX_LAYER_ID, TRAFFIC_COLORS, TRAFFIC_LABELS,
    TRAFFIC_CYCLIST_HINT, TRAFFIC_LINE_PAINT,
    BIKESHARE_ICON_LAYER_ID, BIKESHARE_HITBOX_LAYER_ID, BIKESHARE_BADGE_LAYER_ID,
    BIKESHARE_HAS_BADGE, BIKESHARE_HITBOX_PAINT, BIKESHARE_ICON_LAYOUT, BIKESHARE_ICON_PAINT,
    BIKESHARE_BADGE_LAYOUT, BIKESHARE_BADGE_PAINT, BIKESHARE_COLORS, BIKESHARE_LOGOS,
    formatStationFreshness,
} from './shared/mapConstants';
import './ThematicMap.css';

// react-snap parcourt le site avec un user-agent identifiable. Pendant le prérendu on ne
// monte pas MapLibre : le canvas n'apporte rien au HTML statique, coûte plusieurs secondes
// par page et consomme du quota de tuiles. Le visiteur réel, lui, voit bien la carte.
export const isPrerender = () => typeof navigator !== 'undefined'
    && /ReactSnap/i.test(navigator.userAgent || '');

const THEMATIC_IMAGE_ASSETS = [...POI_IMAGE_ASSETS, ...BIKESHARE_IMAGE_ASSETS];

const BASE_STYLE_KEY = 'userMapBaseStyle';

const readSavedStyle = () => {
    try {
        const saved = localStorage.getItem(BASE_STYLE_KEY);
        return MAP_STYLES.some(s => s.id === saved) ? saved : null;
    } catch {
        return null;
    }
};

const EMPTY = { type: 'FeatureCollection', features: [] };

const withinBbox = (coords, bbox) => {
    let point = coords;
    while (Array.isArray(point[0])) point = point[0];
    const [x, y] = point;
    return x >= bbox[0] && x <= bbox[2] && y >= bbox[1] && y <= bbox[3];
};

const clipToBbox = (collection, bbox) => ({
    type: 'FeatureCollection',
    features: (collection?.features || []).filter(f => f?.geometry?.coordinates
        && withinBbox(f.geometry.coordinates, bbox)),
});

// Charge la couche demandée. Renvoie { features, extra } — `extra` porte les métadonnées
// propres à certaines couches (attributions des accidents, tracé des rues éclairées…).
async function loadLayer(layer, bbox) {
    const bboxParam = bbox.join(',');

    switch (layer.kind) {
        case 'poi': {
            const collections = await Promise.all(
                layer.categories.map(category => getPois(category, bboxParam))
            );
            return { features: collections.flatMap(c => c?.features || []) };
        }
        case 'lighting': {
            const [lamps, litRoads] = await Promise.all([
                getStreetlights(bboxParam),
                getLitRoads().catch(() => null),
            ]);
            return {
                features: lamps?.features || [],
                extra: { litRoads: litRoads ? clipToBbox(litRoads, bbox) : EMPTY },
            };
        }
        case 'accidents': {
            const collection = await getAccidents(bboxParam);
            return {
                features: collection?.features || [],
                extra: { attributions: collection?.attributions || [] },
            };
        }
        case 'bikeshare': {
            const snapshot = await getBikeshareStations();
            return {
                features: clipToBbox(snapshot?.geojson, bbox).features,
                extra: { updatedAt: snapshot?.updated_at, stale: snapshot?.stale },
            };
        }
        case 'traffic': {
            const snapshot = await getTraffic();
            return {
                features: clipToBbox(snapshot?.geojson, bbox).features,
                extra: { updatedAt: snapshot?.updated_at, stale: snapshot?.stale },
            };
        }
        default:
            throw new Error(`type de couche inconnu : ${layer.kind}`);
    }
}

const INTERACTIVE_LAYERS = {
    poi: [POI_LAYER_ID],
    accidents: [ACCIDENT_POINT_LAYER_ID],
    bikeshare: [BIKESHARE_HITBOX_LAYER_ID],
    traffic: [TRAFFIC_HITBOX_LAYER_ID],
    lighting: [],
};

export default function ThematicMap({ city, theme, onData }) {
    const mapRef = useRef();
    const imagesRef = useRef({});
    const fondsRef = useRef(null);
    const { effectiveTheme } = useTheme();
    const [collection, setCollection] = useState(null);
    const [extra, setExtra] = useState({});
    const [erreur, setErreur] = useState(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [imagesReady, setImagesReady] = useState(false);
    const [active, setActive] = useState(null);
    const [baseStyle, setBaseStyle] = useState('base');
    const [menuFonds, setMenuFonds] = useState(false);

    const prerender = isPrerender();

    useEffect(() => {
        if (prerender) return undefined;
        let annule = false;

        setCollection(null);
        setErreur(null);

        loadLayer(theme.layer, city.bbox)
            .then(({ features, extra: meta }) => {
                if (annule) return;
                setCollection({ type: 'FeatureCollection', features });
                setExtra(meta || {});
                onData?.(features, meta || {});
            })
            .catch((e) => {
                if (annule) return;
                console.error('Chargement de la couche thématique impossible :', e);
                setErreur(e);
                onData?.(null, {});
            });

        return () => { annule = true; };
    }, [theme, city, onData, prerender]);

    useEffect(() => {
        const saved = readSavedStyle();
        if (saved) setBaseStyle(saved);
    }, []);

    useEffect(() => {
        if (prerender || !isMapLoaded) return undefined;
        const map = mapRef.current?.getMap?.();
        if (!map) return undefined;

        const registerImages = () => {
            THEMATIC_IMAGE_ASSETS.forEach(({ key }) => {
                const image = imagesRef.current[key];
                if (image && !map.hasImage(key)) map.addImage(key, image, { pixelRatio: 2 });
            });
        };

        let annule = false;
        Promise.all(THEMATIC_IMAGE_ASSETS.map(({ key, src }) => new Promise((resolve) => {
            if (imagesRef.current[key]) return resolve();
            const image = new Image();
            image.onload = () => { imagesRef.current[key] = image; resolve(); };
            image.onerror = () => resolve();
            image.src = src;
            return undefined;
        }))).then(() => {
            if (annule) return;
            registerImages();
            map.on('styledata', registerImages);
            setImagesReady(true);
        });

        return () => {
            annule = true;
            map.off('styledata', registerImages);
        };
    }, [isMapLoaded, prerender]);

    const handleLoad = useCallback(() => {
        setIsMapLoaded(true);
        const map = mapRef.current?.getMap?.();
        map?.fitBounds([[city.bbox[0], city.bbox[1]], [city.bbox[2], city.bbox[3]]], {
            padding: 24,
            duration: 0,
        });
    }, [city.bbox]);

    const handleStyleChange = useCallback((styleId) => {
        setBaseStyle(styleId);
        setMenuFonds(false);
        try {
            localStorage.setItem(BASE_STYLE_KEY, styleId);
        } catch {
        }
        trackEvent('carte_fond', { ville: city.slug, fond: styleId });
    }, [city.slug]);

    useEffect(() => {
        if (!menuFonds) return undefined;
        const surClic = (event) => {
            if (!fondsRef.current?.contains(event.target)) setMenuFonds(false);
        };
        const surTouche = (event) => { if (event.key === 'Escape') setMenuFonds(false); };
        document.addEventListener('mousedown', surClic);
        document.addEventListener('keydown', surTouche);
        return () => {
            document.removeEventListener('mousedown', surClic);
            document.removeEventListener('keydown', surTouche);
        };
    }, [menuFonds]);

    const interactiveLayerIds = useMemo(
        () => (isMapLoaded ? (INTERACTIVE_LAYERS[theme.layer.kind] || []) : []),
        [isMapLoaded, theme.layer.kind]
    );

    const handleClick = useCallback((event) => {
        const feature = event.features?.[0];
        if (!feature) return setActive(null);
        const [lon, lat] = event.lngLat ? [event.lngLat.lng, event.lngLat.lat] : [0, 0];
        return setActive({
            kind: theme.layer.kind,
            lon: feature.geometry?.type === 'Point' ? feature.geometry.coordinates[0] : lon,
            lat: feature.geometry?.type === 'Point' ? feature.geometry.coordinates[1] : lat,
            properties: feature.properties || {},
        });
    }, [theme.layer.kind]);

    const featureCount = collection?.features.length ?? 0;

    const legende = useMemo(
        () => (theme.legend || []).filter(item => !item.needsGraph || city.routing !== false),
        [theme.legend, city.routing]
    );

    if (prerender) {
        return (
            <div className="thematic-map thematic-map--placeholder">
                <p>Carte interactive {city.prep} — {themeLabel(theme).toLowerCase()}.</p>
            </div>
        );
    }

    return (
        <div className="thematic-map">
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: city.center[0],
                    latitude: city.center[1],
                    zoom: city.zoom,
                }}
                mapStyle={mapStyleUrl(baseStyle, effectiveTheme)}
                style={{ width: '100%', height: '100%' }}
                interactiveLayerIds={interactiveLayerIds}
                onLoad={handleLoad}
                onClick={handleClick}
                cursor={interactiveLayerIds.length ? 'pointer' : 'grab'}
                attributionControl={{ compact: true }}
            >
                <NavigationControl position="top-right" showCompass={false} />

                {theme.layer.kind === 'poi' && collection && imagesReady && (
                    <Source id="thematic-pois" type="geojson" data={collection}>
                        <Layer
                            id={POI_LAYER_ID}
                            type="symbol"
                            minzoom={9}
                            layout={POI_LAYER_LAYOUT}
                            paint={poiLayerPaint(effectiveTheme)}
                        />
                    </Source>
                )}

                {theme.layer.kind === 'lighting' && collection && (
                    <>
                        <Source id="thematic-lit-roads" type="geojson" data={extra.litRoads || EMPTY}>
                            <Layer
                                id={LIT_ROADS_GLOW_LAYER_ID}
                                type="line"
                                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                                paint={LIT_ROADS_GLOW_PAINT}
                            />
                            <Layer
                                id={LIT_ROADS_LINE_LAYER_ID}
                                type="line"
                                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                                paint={LIT_ROADS_LINE_PAINT}
                            />
                        </Source>
                        <Source id="thematic-lighting" type="geojson" data={collection}>
                            <Layer id={LIGHTING_HEAT_LAYER_ID} type="heatmap" paint={LIGHTING_HEATMAP_PAINT} />
                        </Source>
                    </>
                )}

                {theme.layer.kind === 'accidents' && collection && (
                    <Source id="thematic-accidents" type="geojson" data={collection}>
                        <Layer
                            id={ACCIDENT_HEAT_LAYER_ID}
                            type="heatmap"
                            maxzoom={ACCIDENT_SWITCH_ZOOM + 1}
                            paint={ACCIDENT_HEAT_PAINT}
                        />
                        <Layer
                            id={ACCIDENT_POINT_LAYER_ID}
                            type="circle"
                            minzoom={ACCIDENT_SWITCH_ZOOM}
                            paint={ACCIDENT_POINT_PAINT}
                        />
                    </Source>
                )}

                {theme.layer.kind === 'traffic' && collection && (
                    <Source id="thematic-traffic" type="geojson" data={collection}>
                        <Layer
                            id={TRAFFIC_HITBOX_LAYER_ID}
                            type="line"
                            minzoom={9}
                            paint={{ 'line-color': 'transparent', 'line-width': 14 }}
                        />
                        <Layer
                            id={TRAFFIC_LAYER_ID}
                            type="line"
                            minzoom={9}
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={TRAFFIC_LINE_PAINT}
                        />
                    </Source>
                )}

                {theme.layer.kind === 'bikeshare' && collection && imagesReady && (
                    <Source id="thematic-bikeshare" type="geojson" data={collection}>
                        <Layer
                            id={BIKESHARE_HITBOX_LAYER_ID}
                            type="circle"
                            minzoom={9}
                            paint={BIKESHARE_HITBOX_PAINT}
                        />
                        <Layer
                            id={BIKESHARE_ICON_LAYER_ID}
                            type="symbol"
                            minzoom={9}
                            layout={BIKESHARE_ICON_LAYOUT}
                            paint={BIKESHARE_ICON_PAINT}
                        />
                        <Layer
                            id={BIKESHARE_BADGE_LAYER_ID}
                            type="symbol"
                            minzoom={9}
                            filter={BIKESHARE_HAS_BADGE}
                            layout={BIKESHARE_BADGE_LAYOUT}
                            paint={BIKESHARE_BADGE_PAINT}
                        />
                    </Source>
                )}

                {active && (
                    <Popup
                        longitude={active.lon}
                        latitude={active.lat}
                        anchor="bottom"
                        offset={18}
                        closeOnClick={false}
                        onClose={() => setActive(null)}
                        className="thematic-popup"
                    >
                        <ThematicPopup active={active} />
                    </Popup>
                )}
            </Map>

            <div className="thematic-map-fonds" ref={fondsRef}>
                {menuFonds && (
                    <div className="thematic-map-fonds-menu" role="menu">
                        {MAP_STYLES.map(style => (
                            <button
                                key={style.id}
                                type="button"
                                role="menuitemradio"
                                aria-checked={baseStyle === style.id}
                                className={`thematic-map-fonds-item${baseStyle === style.id ? ' active' : ''}`}
                                onClick={() => handleStyleChange(style.id)}
                            >
                                <span aria-hidden="true">{style.icon}</span>
                                {style.label}
                            </button>
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    className="thematic-map-fonds-toggle"
                    aria-expanded={menuFonds}
                    aria-haspopup="true"
                    aria-label="Changer le fond de carte"
                    title="Changer le fond de carte"
                    onClick={() => setMenuFonds(ouvert => !ouvert)}
                >
                    <FaLayerGroup size={16} aria-hidden="true" />
                </button>
            </div>

            {legende.length > 0 && (
                <div className="thematic-map-legend">
                    {legende.map(item => (
                        <span key={item.key} className="thematic-legend-item">
                            <span className="thematic-legend-dot" style={{ backgroundColor: item.color }} />
                            {legendLabel(theme.slug, item.key)}
                        </span>
                    ))}
                </div>
            )}

            {!collection && !erreur && (
                <div className="thematic-map-overlay" role="status">Chargement des données…</div>
            )}
            {erreur && (
                <div className="thematic-map-overlay thematic-map-overlay--error" role="alert">
                    Les données ne sont pas disponibles pour le moment. Le fond de carte reste consultable.
                </div>
            )}
            {collection && featureCount === 0 && !erreur && (
                <div className="thematic-map-overlay" role="status">
                    Aucune donnée sur cette emprise pour le moment.
                </div>
            )}
        </div>
    );
}

function ThematicPopup({ active }) {
    const p = active.properties;

    if (active.kind === 'poi') {
        const category = POI_CATEGORIES.find(c => c.id === p.category);
        const details = POI_DETAIL_FIELDS.filter(field => field.except !== p.category
            && p[field.key] != null && p[field.key] !== '');
        return (
            <>
                <div
                    className="thematic-popup-header"
                    style={{ backgroundColor: poiAccentColor(p, category?.color || '#6b7280') }}
                >
                    <img className="thematic-popup-icon" src={poiIconSrc(p)} alt="" />
                    <span>{p.name || category?.label || 'Point d’intérêt'}</span>
                </div>
                <div className="thematic-popup-body">
                    {details.length === 0 && <p>Aucun détail supplémentaire renseigné.</p>}
                    {details.map(field => (
                        <p key={field.key}>
                            {field.label} : <strong>{(field.format || formatPoiTag)(p[field.key])}</strong>
                        </p>
                    ))}
                </div>
            </>
        );
    }

    if (active.kind === 'accidents') {
        const details = ACCIDENT_DETAIL_FIELDS.filter(f => p[f.key] != null && p[f.key] !== '');
        const date = formatAccidentDate(p);
        return (
            <>
                <div className="thematic-popup-header" style={{ backgroundColor: '#dc2626' }}>
                    <span>{p.severity_label ? `Accident — ${p.severity_label}` : 'Accident'}</span>
                </div>
                <div className="thematic-popup-body">
                    {date && <p>Date : <strong>{date}</strong></p>}
                    {details.map(field => (
                        <p key={field.key}>{field.label} : <strong>{p[field.key]}</strong></p>
                    ))}
                </div>
            </>
        );
    }

    if (active.kind === 'traffic') {
        return (
            <>
                <div
                    className="thematic-popup-header"
                    style={{ backgroundColor: TRAFFIC_COLORS[p.level] || TRAFFIC_COLORS.gray }}
                >
                    <span>{TRAFFIC_LABELS[p.level] || 'État inconnu'}</span>
                </div>
                <div className="thematic-popup-body">
                    {p.commune && <p>Commune : <strong>{p.commune}</strong></p>}
                    {TRAFFIC_CYCLIST_HINT[p.level] && <p>{TRAFFIC_CYCLIST_HINT[p.level]}</p>}
                </div>
            </>
        );
    }

    // bikeshare
    const bikes = typeof p.bikes_available === 'number' ? p.bikes_available : null;
    const off = p.is_renting === false || p.is_installed === false;
    const couleur = off || bikes == null ? BIKESHARE_COLORS.off
        : bikes === 0 ? BIKESHARE_COLORS.empty
            : p.docks_available === 0 ? BIKESHARE_COLORS.full
                : bikes <= 2 ? BIKESHARE_COLORS.low
                    : BIKESHARE_COLORS.ok;
    const freshness = formatStationFreshness(p.last_reported);
    return (
        <>
            <div className="thematic-popup-header" style={{ backgroundColor: couleur }}>
                {BIKESHARE_LOGOS[p.system] && (
                    <img className="thematic-popup-icon" src={BIKESHARE_LOGOS[p.system]} alt="" />
                )}
                <span>{p.name || 'Station'}</span>
            </div>
            <div className="thematic-popup-body">
                {off && <p>Station hors service.</p>}
                {!off && bikes != null && (
                    <p>Vélos disponibles : <strong>{bikes}</strong>
                        {typeof p.bikes_electric === 'number' && p.bikes_electric > 0
                            && <> dont <strong>{p.bikes_electric}</strong> électriques</>}
                    </p>
                )}
                {typeof p.docks_available === 'number' && (
                    <p>Places libres : <strong>{p.docks_available}</strong></p>
                )}
                {p.system_name && <p>Réseau : <strong>{p.system_name}</strong></p>}
                {freshness && <p className="thematic-popup-note">{freshness}</p>}
            </div>
        </>
    );
}
