"""Cycle de vie des signalements : expiration, votes « Là / Pas là », désactivation.

Rien n'est stocké : compteurs et statut sont recalculés à la lecture à partir des
votes encore valides — dans le même esprit que l'expiration temporelle d'origine.

Règles :
- Chaque type a une fenêtre de vie `W = REPORT_EXPIRY[type]`.
- Un vote (là ou pas là) est *valide* tant que `now - vote.created_at < W` ; au-delà
  il « périme » et ne compte plus.
- Un « Confirmer » (vote valide `is_present=True`) prolonge la vie du signalement :
  `last_alive = max(created_at, dernier confirm valide)`, et
  `is_expired = now - last_alive >= W`. Les « Pas là » ne prolongent pas.
- `confirmations_count` / `denials_count` = votes valides de chaque bord.
- `is_disabled = (denials_count - confirmations_count) >= DISABLE_THRESHOLD`.

Ce module est partagé entre `routers/report.py` et `routers/route.py` pour éviter
tout import croisé entre routeurs.
"""

from datetime import datetime, timedelta
from typing import Dict, List

from sqlalchemy.orm import Session

from models.report import Report
from models.report_vote import ReportVote

# Durée de vie par défaut d'un signalement selon son type.
REPORT_EXPIRY = {
    "accident": timedelta(hours=2),
    "danger":   timedelta(hours=4),
    "obstacle": timedelta(hours=3),
    "travaux":  timedelta(days=4),
}

DEFAULT_EXPIRY = timedelta(hours=4)

# Écart (pas là - confirmé) à partir duquel un signalement est désactivé.
DISABLE_THRESHOLD = 3


def _window(report_type: str) -> timedelta:
    return REPORT_EXPIRY.get(report_type, DEFAULT_EXPIRY)


def compute_status(report: Report, votes: List[ReportVote], now: datetime) -> dict:
    """Calcule compteurs et statut d'un signalement à partir de ses votes.

    `votes` : les votes de CE signalement (peut être vide).
    Retourne un dict : confirmations_count, denials_count, is_expired, is_disabled.
    """
    window = _window(report.report_type)
    valid = [v for v in votes if now - v.created_at < window]

    confirmations = sum(1 for v in valid if v.is_present)
    denials = sum(1 for v in valid if not v.is_present)

    # Un signalement vérifié par un admin reste actif
    if getattr(report, "is_verified", False):
        return {
            "confirmations_count": confirmations,
            "denials_count": denials,
            "is_expired": False,
            "is_disabled": False,
        }

    confirm_dates = [v.created_at for v in valid if v.is_present]
    last_alive = max([report.created_at, *confirm_dates])
    is_expired = now - last_alive >= window

    is_disabled = (denials - confirmations) >= DISABLE_THRESHOLD

    return {
        "confirmations_count": confirmations,
        "denials_count": denials,
        "is_expired": is_expired,
        "is_disabled": is_disabled,
    }


def load_votes_by_report(db: Session, report_ids: List[int]) -> Dict[int, List[ReportVote]]:
    """Charge en une requête tous les votes des signalements donnés, groupés par id."""
    grouped: Dict[int, List[ReportVote]] = {}
    if not report_ids:
        return grouped
    votes = db.query(ReportVote).filter(ReportVote.report_id.in_(report_ids)).all()
    for vote in votes:
        grouped.setdefault(vote.report_id, []).append(vote)
    return grouped
