from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.report import Report
from schemas.report import ReportCreate, ReportRead
from dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/", response_model=ReportRead, status_code=201)
def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
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
    return db_report

@router.get("/", response_model=List[ReportRead])
def get_all_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()

@router.get("/me", response_model=List[ReportRead])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(Report).filter(Report.user_id == current_user.id).order_by(Report.created_at.desc()).all()

@router.delete("/{report_id}", status_code=204)
def delete_report(report_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Signalement introuvable.")
    db.delete(report)
    db.commit()