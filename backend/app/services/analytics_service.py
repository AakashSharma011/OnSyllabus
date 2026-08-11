from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.resource import ClickEvent


def get_total_clicks(db: Session) -> int:
    return db.query(func.count(ClickEvent.id)).scalar() or 0
