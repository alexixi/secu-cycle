// Colonnes du planning. Les clés `key` doivent rester synchronisées avec le
// backend (models/task.py TASK_STATUSES).
export const STATUS_OPTIONS = [
  { key: "a_faire", label: "À faire" },
  { key: "en_cours", label: "En cours" },
  { key: "fait", label: "Fait" },
];

export const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, s) => {
  acc[s.key] = s.label;
  return acc;
}, {});

// Libellé lisible d'un admin (nom complet, sinon e-mail).
export function adminLabel(admin) {
  if (!admin) return "—";
  const full = [admin.first_name, admin.last_name].filter(Boolean).join(" ");
  return full || admin.email;
}

// Palette de couleurs proposée par défaut pour les nouvelles étiquettes.
export const TAG_COLORS = [
  "#3B82F6", // bleu
  "#10B981", // vert
  "#F59E0B", // ambre
  "#EF4444", // rouge
  "#8B5CF6", // violet
  "#EC4899", // rose
  "#14B8A6", // sarcelle
  "#6B7280", // gris
];

// Renvoie une couleur de texte (noir ou blanc) lisible sur un fond donné (#RRGGBB).
export function readableTextColor(hex) {
  if (!hex || hex.length < 7) return "#fff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Luminance perçue (ITU-R BT.601).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1a1a1a" : "#fff";
}
