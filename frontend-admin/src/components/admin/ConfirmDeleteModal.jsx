import { useEffect, useState } from "react";
import { LuTriangleAlert } from "react-icons/lu";
import Button from "../ui/Button";
import "../ui/PopUp.css";
import "./ConfirmDeleteModal.css";

export default function ConfirmDeleteModal({
  user,
  title,
  message,
  confirmLabel = "Supprimer définitivement",
  busyLabel = "Suppression…",
  onCancel,
  onConfirm,
}) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [onCancel]);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const label = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
    : null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.classList.contains("modal-overlay") && onCancel()}
    >
      <div className="modal-content confirm-delete-modal">
        <div className="confirm-delete-icon">
          <LuTriangleAlert size={28} />
        </div>
        <h2>{title || "Supprimer cet utilisateur ?"}</h2>
        {message ? (
          <p>{message}</p>
        ) : (
          <p>
            Le compte de <strong>{label}</strong> ({user.email}) sera définitivement supprimé.
            Cette action est irréversible.
          </p>
        )}
        <div className="modal-actions">
          <Button type="button" onClick={onCancel} disabled={busy}>
            Annuler
          </Button>
          <Button type="button" className="danger-button" onClick={handleConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
