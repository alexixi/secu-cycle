from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List
from datetime import datetime
from database import get_db
from models.report import Report
from models.report_vote import ReportVote
from models.user import User
from schemas.report import (
    ReportCreate,
    ReportRead,
    ReportAdminRead,
    ReportVoteCreate,
    ReportVoteResult,
    ReportVerifyUpdate,
)
from dependencies import get_current_user, require_admin
from admin_emails import is_user_admin
from graph.route_cache import route_cache
from reports_lifecycle import compute_status, load_votes_by_report
from limiter import limiter

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/", response_model=ReportRead, status_code=201)
@limiter.limit("20/minute")
def create_report(
    request: Request,
    report: ReportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.reports_blocked:
        raise HTTPException(
            status_code=403,
            detail="Vous n'êtes plus autorisé à déposer des signalements.",
        )
    db_report = Report(
        user_id=current_user.id,
        report_type=report.report_type,
        report_description=report.report_description,
        latitude=report.latitude,
        longitude=report.longitude,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    route_cache.invalidate()
    db_report.confirmations_count = 0
    db_report.denials_count = 0
    return db_report

@router.get("/", response_model=List[ReportRead])
def get_all_reports(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    votes_by_report = load_votes_by_report(db, [r.id for r in reports])

    visible = []
    for report in reports:
        status = compute_status(report, votes_by_report.get(report.id, []), now)
        if status["is_expired"] or status["is_disabled"]:
            continue
        report.confirmations_count = status["confirmations_count"]
        report.denials_count = status["denials_count"]
        visible.append(report)
    return visible

def _to_admin_read(report: Report, author, votes, now: datetime) -> ReportAdminRead:
    """Construit la vue admin d'un signalement (statut recalculé + infos auteur)."""
    author_name = None
    if author is not None:
        author_name = " ".join(
            p for p in [author.first_name, author.last_name] if p
        ).strip() or None
    status = compute_status(report, votes, now)
    return ReportAdminRead(
        id=report.id,
        user_id=report.user_id,
        report_type=report.report_type,
        report_description=report.report_description,
        latitude=report.latitude,
        longitude=report.longitude,
        created_at=report.created_at,
        confirmations_count=status["confirmations_count"],
        denials_count=status["denials_count"],
        is_verified=bool(report.is_verified),
        is_expired=status["is_expired"],
        is_disabled=status["is_disabled"],
        author_email=author.email if author else None,
        author_name=author_name,
        author_is_banned=bool(author.is_banned) if author else False,
        author_reports_blocked=bool(author.reports_blocked) if author else False,
    )


@router.get("/admin", response_model=List[ReportAdminRead])
def get_all_reports_admin(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Tous les signalements (y compris expirés/désactivés), enrichis des infos auteur — pour la modération."""
    now = datetime.utcnow()
    rows = (
        db.query(Report, User)
        .outerjoin(User, Report.user_id == User.id)
        .order_by(Report.created_at.desc())
        .all()
    )
    votes_by_report = load_votes_by_report(db, [report.id for report, _ in rows])
    return [
        _to_admin_read(report, author, votes_by_report.get(report.id, []), now)
        for report, author in rows
    ]


@router.patch("/{report_id}/verify", response_model=ReportAdminRead)
def set_report_verified(
    report_id: int,
    payload: ReportVerifyUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Marque un signalement comme vérifié (toujours actif) ou retire ce statut."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Signalement introuvable.")

    report.is_verified = payload.is_verified
    db.commit()
    db.refresh(report)
    route_cache.invalidate()

    now = datetime.utcnow()
    author = db.query(User).filter(User.id == report.user_id).first() if report.user_id else None
    votes = db.query(ReportVote).filter(ReportVote.report_id == report_id).all()
    return _to_admin_read(report, author, votes, now)

@router.get("/me", response_model=List[ReportRead])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    now = datetime.utcnow()
    reports = (
        db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .all()
    )
    votes_by_report = load_votes_by_report(db, [r.id for r in reports])
    for report in reports:
        status = compute_status(report, votes_by_report.get(report.id, []), now)
        report.confirmations_count = status["confirmations_count"]
        report.denials_count = status["denials_count"]
    return reports

@router.post("/{report_id}/vote", response_model=ReportVoteResult)
@limiter.limit("30/minute")
def vote_report(
    request: Request,
    report_id: int,
    vote: ReportVoteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Confirme (« Là ») ou infirme (« Pas là ») un signalement.

    Un seul vote par utilisateur : re-voter met à jour le vote existant et rafraîchit
    sa date (le vote redevient « frais »). Compteurs et statut sont recalculés.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Signalement introuvable.")
    if report.user_id == current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Vous ne pouvez pas voter sur votre propre signalement.",
        )

    existing = (
        db.query(ReportVote)
        .filter(ReportVote.report_id == report_id, ReportVote.user_id == current_user.id)
        .first()
    )
    if existing:
        existing.is_present = vote.is_present
        existing.created_at = func.now()
    else:
        db.add(
            ReportVote(
                report_id=report_id,
                user_id=current_user.id,
                is_present=vote.is_present,
            )
        )
    db.commit()

    route_cache.invalidate()

    now = datetime.utcnow()
    votes = db.query(ReportVote).filter(ReportVote.report_id == report_id).all()
    status = compute_status(report, votes, now)
    return ReportVoteResult(
        id=report.id,
        confirmations_count=status["confirmations_count"],
        denials_count=status["denials_count"],
        is_disabled=status["is_disabled"],
        my_vote=vote.is_present,
    )

@router.delete("/{report_id}", status_code=204)
def delete_report(report_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(Report).filter(Report.id == report_id)
    if not is_user_admin(current_user):
        query = query.filter(Report.user_id == current_user.id)
    report = query.first()
    if not report:
        raise HTTPException(status_code=404, detail="Signalement introuvable.")
    db.delete(report)
    db.commit()
    route_cache.invalidate()
