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
