from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.chat_history import ChatHistory
from app.models.major import Major
from app.models.user import User

router = APIRouter()


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    recent_questions = (
        db.query(ChatHistory)
        .order_by(ChatHistory.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_users": db.query(User).count(),
        "active_users": db.query(User).filter(User.is_active == True).count(),
        "locked_users": db.query(User).filter(User.is_active == False).count(),
        "total_majors": db.query(Major).count(),
        "total_chat_histories": db.query(ChatHistory).count(),
        "recent_questions": [
            {
                "id": item.id,
                "question": item.question,
                "status": item.status,
                "created_at": item.created_at,
                "user_id": item.user_id,
            }
            for item in recent_questions
        ],
    }
