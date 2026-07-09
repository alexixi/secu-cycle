from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from database import get_db
from models.report import Report
from models.user import User
from schemas.report import ReportCreate, ReportRead, ReportAdminRead
from dependencies import get_current_user, require_admin
from admin_emails import is_user_admin
from graph.route_cache import route_cache

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/", response_model=ReportRead, status_code=201)
def create_report(
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
    return db_report

REPORT_EXPIRY = {
    "accident": timedelta(hours=2),
    "danger":   timedelta(hours=4),
    "obstacle": timedelta(hours=3),
    "travaux":  timedelta(days=4),
}

def _is_expired(report: Report, now: datetime) -> bool:
    return now - report.created_at >= REPORT_EXPIRY.get(report.report_type, timedelta(hours=4))

@router.get("/", response_model=List[ReportRead])
def get_all_reports(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [r for r in reports if not _is_expired(r, now)]

@router.get("/admin", response_model=List[ReportAdminRead])
def get_all_reports_admin(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Tous les signalements (y compris expirés), enrichis des infos auteur — pour la modération."""
    now = datetime.utcnow()
    rows = (
        db.query(Report, User)
        .outerjoin(User, Report.user_id == User.id)
        .order_by(Report.created_at.desc())
        .all()
    )
    result = []
    for report, author in rows:
        author_name = None
        if author is not None:
            author_name = " ".join(
                p for p in [author.first_name, author.last_name] if p
            ).strip() or None
        result.append(
            ReportAdminRead(
                id=report.id,
                user_id=report.user_id,
                report_type=report.report_type,
                report_description=report.report_description,
                latitude=report.latitude,
                longitude=report.longitude,
                created_at=report.created_at,
                is_expired=_is_expired(report, now),
                author_email=author.email if author else None,
                author_name=author_name,
                author_is_banned=bool(author.is_banned) if author else False,
                author_reports_blocked=bool(author.reports_blocked) if author else False,
            )
        )
    return result

@router.get("/me", response_model=List[ReportRead])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(Report).filter(Report.user_id == current_user.id).order_by(Report.created_at.desc()).all()

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
