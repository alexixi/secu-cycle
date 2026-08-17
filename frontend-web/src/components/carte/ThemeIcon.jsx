import {
    MdOutlineLocalParking, MdOutlineWc, MdOutlineWaterDrop, MdOutlineBuild,
    MdOutlineLightbulb, MdOutlineTraffic, MdOutlineReportProblem,
} from 'react-icons/md';
import { FaBicycle } from 'react-icons/fa';

// Icône de chaque carte thématique. Les couches déjà présentes sur la carte d'itinéraire
// reprennent exactement son icône (éclairage, trafic, accidents, vélos en libre-service)
// pour que le visiteur retrouve le même repère visuel d'une page à l'autre.
// Les clés correspondent aux thèmes de src/data/thematicMaps.js — le registre reste du JS
// pur (il est importé par les scripts Node de build), d'où cette table séparée.
export const THEME_ICONS = {
    'stationnements-velo': MdOutlineLocalParking,
    'toilettes-publiques': MdOutlineWc,
    'points-eau': MdOutlineWaterDrop,
    'toilettes-et-points-eau': MdOutlineWc,
    'reparation-velo': MdOutlineBuild,
    'eclairage-public': MdOutlineLightbulb,
    'velos-libre-service': FaBicycle,
    'trafic-routier': MdOutlineTraffic,
    'accidents-velo': MdOutlineReportProblem,
};

export default function ThemeIcon({ slug, className, size }) {
    const Icon = THEME_ICONS[slug];
    if (!Icon) return null;
    return <Icon className={className} size={size} aria-hidden="true" focusable="false" />;
}
