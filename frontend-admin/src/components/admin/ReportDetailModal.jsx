import { useEffect, useState } from "react";
import { LuBan, LuShieldCheck, LuOctagonX, LuCircleCheck, LuMapPin } from "react-icons/lu";
import Button from "../ui/Button";
import ReportMap from "./ReportMap";
import { ABUSE_REASONS } from "./ReportsManager";
import "../ui/PopUp.css";
import "./UserDetailModal.css";
import "./ReportsManager.css";

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
};

export default function ReportDetailModal({
  report,
  typeMeta,
  onClose,
  onDeleteReport,
  onSanction,
  onSetVerified,
}) {
  const [banReason, setBanReason] = useState(report.ban_reason || "");
  const [busy, setBusy] = useState(null); // "block" | "ban" | null
  const [confirmBan, setConfirmBan] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const toggleVerified = async () => {
    if (!onSetVerified) return;
    setError(null);
    setVerifying(true);
    try {
      await onSetVerified(report.id, !report.is_verified);
    } catch (err) {
      setError(err.message || "Action impossible.");
    } finally {
      setVerifying(false);
    }
  };

  const hasAuthor = !!report.user_id;
  const isBanned = report.author_is_banned;
  const isBlocked = report.author_reports_blocked;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  const runSanction = async (action, updates) => {
    setError(null);
    setBusy(action);
    try {
      await onSanction(report.user_id, updates);
      setConfirmBan(false);
    } catch (err) {
      setError(err.message || "Action impossible.");
    } finally {
      setBusy(null);
    }
  };

  const toggleBlock = () => runSanction("block", { reports_blocked: !isBlocked });

  const confirmBanAction = () =>
    runSanction("ban", {
      is_banned: true,
      ban_reason: banReason.trim() || null,
    });

  const unban = () => runSanction("ban", { is_banned: false });

  const authorName = report.author_name || report.author_email || (hasAuthor ? `Utilisateur #${report.user_id}` : "Compte supprimé");

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.classList.contains("modal-overlay") && onClose()}
    >
      <div className="modal-content report-detail-modal">
        <div className="user-detail-header">
          <h2>
            <span className={`type-badge ${typeMeta?.className || ""}`}>
              {typeMeta?.label || report.report_type || "Signalement"}
            </span>
          </h2>
          <div className="user-detail-meta">
            <span>Signalement #{report.id}</span>
            <span>{formatDateTime(report.created_at)}</span>
            <span className={`status-badge ${report.is_disabled ? "disabled" : report.is_expired ? "expired" : "active"}`}>
              {report.is_disabled ? "Désactivé" : report.is_expired ? "Expiré" : "Actif"}
            </span>
          </div>
        </div>

        <div className="report-detail-body">
          <div className="report-detail-cols">
            <div className="report-detail-info">
              <div className="user-detail-field">
                <span>Description</span>
                <p className="user-detail-value">{report.report_description || "—"}</p>
              </div>

              {report.abuse_count > 0 && (
                <div className="user-detail-field">
                  <span>Signalements d&apos;utilisateurs</span>
                  <div className="abuse-breakdown">
                    {Object.entries(report.abuse_reasons || {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([reason, count]) => (
                        <span key={reason} className="abuse-reason-chip">
                          {ABUSE_REASONS[reason] || reason}
                          <strong>×{count}</strong>
                        </span>
                      ))}
                  </div>
                  <p className="abuse-note">
                    {report.is_hidden_for_abuse
                      ? "Masqué de la carte en attendant votre décision. Le marquer « vérifié » le rétablit."
                      : "Encore visible sur la carte : le seuil de masquage n'est pas atteint."}
                  </p>
                </div>
              )}

              <div className="user-detail-field">
                <span>Votes de la communauté</span>
                <p className="user-detail-value vote-counts">
                  <span className="vote-count vote-yes">👍 {report.confirmations_count ?? 0} là</span>
                  <span className="vote-count vote-no">👎 {report.denials_count ?? 0} pas là</span>
                </p>
              </div>

              <div className="user-detail-field">
                <label className="report-verified-toggle">
                  <input
                    type="checkbox"
                    checked={!!report.is_verified}
                    disabled={verifying}
                    onChange={toggleVerified}
                  />
                  <span>
                    <strong>Signalement vérifié</strong>
                    <em>
                      {" "}— reste actif quels que soient les votes et l'expiration.
                    </em>
                  </span>
                </label>
              </div>

              <div className="user-detail-field">
                <span>Position</span>
                <p className="user-detail-value">
                  {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}{" "}
                  <a
                    className="report-map-link"
                    href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=17/${report.latitude}/${report.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <LuMapPin size={14} /> Voir sur la carte
                  </a>
                </p>
              </div>

              <div className="user-detail-field">
                <span>Auteur</span>
                <p className="user-detail-value">
                  {authorName}
                  {report.author_email && report.author_name && (
                    <em className="report-author-email"> · {report.author_email}</em>
                  )}
                </p>
              </div>

              {/* Panneau de sanctions */}
              <div className="report-sanctions">
                <h3>Sanctions</h3>
                {!hasAuthor ? (
                  <p className="report-sanctions-note">
                    Auteur inconnu (compte supprimé) — aucune sanction possible.
                  </p>
                ) : (
                  <>
                    <div className="report-sanction-row">
                      <div className="report-sanction-info">
                        <strong>Accès aux signalements</strong>
                        <span>
                          {isBlocked
                            ? "L'auteur ne peut plus déposer de signalements."
                            : "L'auteur peut déposer des signalements."}
                        </span>
                      </div>
                      <Button
                        type="button"
                        className={isBlocked ? "" : "danger-button"}
                        disabled={busy !== null}
                        onClick={toggleBlock}
                      >
                        {isBlocked ? (
                          <>
                            <LuCircleCheck size={16} /> Débloquer
                          </>
                        ) : (
                          <>
                            <LuOctagonX size={16} /> Bloquer
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="report-sanction-row">
                      <div className="report-sanction-info">
                        <strong>Compte</strong>
                        <span>
                          {isBanned
                            ? "Le compte est banni (connexion refusée)."
                            : "Le compte est actif."}
                        </span>
                      </div>
                      {isBanned ? (
                        <Button type="button" disabled={busy !== null} onClick={unban}>
                          <LuShieldCheck size={16} /> Débannir
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className="danger-button"
                          disabled={busy !== null}
                          onClick={() => setConfirmBan(true)}
                        >
                          <LuBan size={16} /> Bannir
                        </Button>
                      )}
                    </div>

                    {confirmBan && !isBanned && (
                      <div className="report-ban-confirm">
                        <label>
                          Motif (optionnel)
                          <input
                            type="text"
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="Ex. signalements abusifs répétés"
                          />
                        </label>
                        <p>Confirmer le bannissement de cet utilisateur ?</p>
                        <div className="report-ban-confirm-actions">
                          <Button type="button" onClick={() => setConfirmBan(false)} disabled={busy !== null}>
                            Annuler
                          </Button>
                          <Button
                            type="button"
                            className="danger-button"
                            onClick={confirmBanAction}
                            disabled={busy !== null}
                          >
                            {busy === "ban" ? "Bannissement…" : "Confirmer le bannissement"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {error && <div className="reports-alert">{error}</div>}
            </div>

            <ReportMap
              latitude={report.latitude}
              longitude={report.longitude}
              reportType={report.report_type}
            />
          </div>
        </div>

        <div className="modal-actions user-detail-actions">
          <Button
            type="button"
            className="danger-button"
            disabled={busy !== null}
            onClick={() => onDeleteReport(report)}
          >
            <LuOctagonX size={16} /> Supprimer le signalement
          </Button>
          <div className="user-detail-actions-right">
            <Button type="button" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
