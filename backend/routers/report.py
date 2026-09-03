from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List
from datetime import datetime
from database import get_db
from i18n import get_locale, t
from models.report import Report
from models.report_abuse import ReportAbuse
from models.report_vote import ReportVote
from models.user import User
from models.user_block import UserBlock
from schemas.report import (
    ReportCreate,
    ReportRead,
    ReportAdminRead,
    ReportVoteCreate,
    ReportVoteResult,
    ReportVerifyUpdate,
    ReportAbuseCreate,
    ReportAbuseResult,
)
from dependencies import get_current_user, get_current_user_optional, require_admin
from admin_emails import is_user_admin
from graph.route_cache import route_cache
from reports_lifecycle import (
    compute_status,
    load_votes_by_report,
    load_abuse_counts,
    load_abuse_reasons,
    is_hidden_for_abuse,
)
from limiter import limiter

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/", response_model=ReportRead, status_code=201)
@limiter.limit("20/minute")
def create_report(
    request: Request,
    report: ReportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    locale: str = Depends(get_locale),
):
    if current_user.reports_blocked:
        raise HTTPException(
            status_code=403,
            detail=t("error.report.banned", locale),
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

def _blocked_author_ids(db: Session, current_user) -> set:
    """Auteurs que l'appelant a bloqués. Vide pour un visiteur non connecté."""
    if current_user is None:
        return set()
    rows = (
        db.query(UserBlock.blocked_id)
        .filter(UserBlock.blocker_id == current_user.id)
        .all()
    )
    return {row[0] for row in rows}


@router.get("/", response_model=List[ReportRead])
def get_all_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """Signalements visibles. L'authentification est facultative : elle ne sert
    qu'à retirer les auteurs que l'appelant a bloqués."""
    now = datetime.utcnow()
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    report_ids = [r.id for r in reports]
    votes_by_report = load_votes_by_report(db, report_ids)
    abuse_counts = load_abuse_counts(db, report_ids)
    blocked = _blocked_author_ids(db, current_user)

    visible = []
    for report in reports:
        status = compute_status(report, votes_by_report.get(report.id, []), now)
        if status["is_expired"] or status["is_disabled"]:
            continue
        if is_hidden_for_abuse(report, abuse_counts.get(report.id, 0)):
            continue
        if report.user_id is not None and report.user_id in blocked:
            continue
        report.confirmations_count = status["confirmations_count"]
        report.denials_count = status["denials_count"]
        visible.append(report)
    return visible

def _to_admin_read(
    report: Report, author, votes, now: datetime,
    abuse_count: int = 0, abuse_reasons: dict | None = None,
) -> ReportAdminRead:
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
        abuse_count=abuse_count,
        is_hidden_for_abuse=is_hidden_for_abuse(report, abuse_count),
        abuse_reasons=abuse_reasons or {},
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
    report_ids = [report.id for report, _ in rows]
    votes_by_report = load_votes_by_report(db, report_ids)
    abuse_counts = load_abuse_counts(db, report_ids)
    abuse_reasons = load_abuse_reasons(db, report_ids)
    return [
        _to_admin_read(
            report, author, votes_by_report.get(report.id, []), now,
            abuse_counts.get(report.id, 0), abuse_reasons.get(report.id),
        )
        for report, author in rows
    ]


@router.patch("/{report_id}/verify", response_model=ReportAdminRead)
def set_report_verified(
    report_id: int,
    payload: ReportVerifyUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
    locale: str = Depends(get_locale),
):
    """Marque un signalement comme vérifié (toujours actif) ou retire ce statut."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=t("error.report.not_found", locale))

    report.is_verified = payload.is_verified
    db.commit()
    db.refresh(report)
    route_cache.invalidate()

    now = datetime.utcnow()
    author = db.query(User).filter(User.id == report.user_id).first() if report.user_id else None
    votes = db.query(ReportVote).filter(ReportVote.report_id == report_id).all()
    # Sans ces deux-là, la ligne renvoyée après le basculement repartirait avec
    # zéro dénonciation et effacerait le motif de l'écran du modérateur.
    abuse_count = load_abuse_counts(db, [report_id]).get(report_id, 0)
    abuse_reasons = load_abuse_reasons(db, [report_id]).get(report_id)
    return _to_admin_read(report, author, votes, now, abuse_count, abuse_reasons)

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
    locale: str = Depends(get_locale),
):
    """Confirme (« Là ») ou infirme (« Pas là ») un signalement.

    Un seul vote par utilisateur : re-voter met à jour le vote existant et rafraîchit
    sa date (le vote redevient « frais »). Compteurs et statut sont recalculés.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=t("error.report.not_found", locale))
    if report.user_id == current_user.id:
        raise HTTPException(
            status_code=403,
            detail=t("error.report.self_vote", locale),
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

@router.post("/{report_id}/abuse", response_model=ReportAbuseResult, status_code=201)
@limiter.limit("10/hour")
def report_abuse(
    request: Request,
    report_id: int,
    data: ReportAbuseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    locale: str = Depends(get_locale),
):
    """Dénonce un signalement pour contenu répréhensible.

    Distinct du vote « Pas là », qui juge l'exactitude : un signalement peut être
    exact et inacceptable. Au-delà d'ABUSE_THRESHOLD dénonciations distinctes le
    signalement disparaît de la carte, en attendant la décision d'un modérateur.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail=t("error.report.not_found", locale))

    if report.user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail=t("error.report.self_flag", locale),
        )

    existing = (
        db.query(ReportAbuse)
        .filter(ReportAbuse.report_id == report_id, ReportAbuse.user_id == current_user.id)
        .first()
    )
    if existing is None:
        db.add(ReportAbuse(report_id=report_id, user_id=current_user.id, reason=data.reason))
        db.commit()
    else:
        # Re-dénoncer ne compte pas double, mais met le motif à jour : la
        # première réaction est souvent la moins précise.
        existing.reason = data.reason
        db.commit()

    count = load_abuse_counts(db, [report_id]).get(report_id, 0)
    hidden = is_hidden_for_abuse(report, count)
    if hidden:
        # Le signalement ne doit plus peser sur les itinéraires déjà calculés.
        route_cache.invalidate()
    return ReportAbuseResult(id=report_id, abuse_count=count, is_hidden=hidden)


@router.post("/{report_id}/block-author", status_code=204)
@limiter.limit("30/hour")
def block_report_author(
    request: Request,
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    locale: str = Depends(get_locale),
):
    """Masque tous les signalements de l'auteur de ce signalement, pour l'appelant.

    Le blocage part d'un signalement et non d'un identifiant d'utilisateur :
    l'auteur n'est jamais exposé au client, et il n'y a pas d'annuaire à parcourir.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail=t("error.report.not_found", locale))

    if report.user_id is None:
        raise HTTPException(
            status_code=400,
            detail=t("error.report.no_author", locale),
        )
    if report.user_id == current_user.id:
        raise HTTPException(status_code=400, detail=t("error.report.self_block", locale))

    already = (
        db.query(UserBlock)
        .filter(UserBlock.blocker_id == current_user.id, UserBlock.blocked_id == report.user_id)
        .first()
    )
    if already is None:
        db.add(UserBlock(blocker_id=current_user.id, blocked_id=report.user_id))
        db.commit()


@router.delete("/{report_id}", status_code=204)
def delete_report(report_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user),
                  locale: str = Depends(get_locale)):
    query = db.query(Report).filter(Report.id == report_id)
    if not is_user_admin(current_user):
        query = query.filter(Report.user_id == current_user.id)
    report = query.first()
    if not report:
        raise HTTPException(status_code=404, detail=t("error.report.not_found", locale))
    db.delete(report)
    db.commit()
    route_cache.invalidate()
