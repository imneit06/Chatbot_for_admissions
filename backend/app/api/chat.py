from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
import time
import logging

from app.db.session import get_db
from app.models.chat_history import ChatHistory

from typing import Any
from rag_app.rag.chain import answer_question

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str
    user_id: str

class ChatResponse(BaseModel):
    reply: str
    status: str
    sources: list[dict[str, Any]] = []

@router.post("/", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        result = answer_question(
            question=request.message,
            session_id=str(request.user_id),
        )

        reply_text = result.get("answer", "")
        sources = result.get("sources", [])

        chat_history = ChatHistory(
            user_id=str(request.user_id),
            question=request.message,
            answer=reply_text,
            status="Đã trả lời",
        )

        db.add(chat_history)
        db.commit()
        db.refresh(chat_history)

        return ChatResponse(
            reply=reply_text,
            status="Đã trả lời",
            sources=sources,
        )

    except Exception as e:
        logger.exception("Chat endpoint failed")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi gọi RAG: {str(e)}",
        )

# --- API MỚI: LẤY LỊCH SỬ THEO USER ---
@router.get("/history/{user_id}")
def get_user_history(user_id: str, db: Session = Depends(get_db)):
    histories = db.query(ChatHistory).filter(ChatHistory.user_id == user_id).order_by(ChatHistory.created_at.desc()).all()
    
    result = []
    for h in histories:
        # Cộng thêm 7 tiếng để chuyển từ giờ Quốc tế (UTC) sang giờ Việt Nam (UTC+7)
        local_time = h.created_at + timedelta(hours=7)
        
        result.append({
            "id": h.id,
            "created_at": local_time.isoformat(),
            "date": local_time.strftime("%d/%m/%Y"),
            "time": local_time.strftime("%H:%M"), # Bây giờ giờ sẽ hiển thị chuẩn!
            "question": h.question,
            "answer": h.answer,
            "status": h.status
        })
    return result


@router.delete("/history/item/{history_id}")
def delete_history_item(
    history_id: int,
    user_id: str,
    role: str = "user",
    db: Session = Depends(get_db),
):
    history = db.query(ChatHistory).filter(ChatHistory.id == history_id).first()

    if not history:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử chat")

    if str(history.user_id) != str(user_id) and role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa lịch sử này")

    db.delete(history)
    db.commit()

    return {"message": "Đã xóa lịch sử chat"}
