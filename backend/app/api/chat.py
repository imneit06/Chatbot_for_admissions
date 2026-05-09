from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
import time

from app.db.session import get_db
from app.models.chat_history import ChatHistory

from typing import Any
from rag_app.rag.chain import answer_question

router = APIRouter()

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
            "date": local_time.strftime("%d/%m/%Y"),
            "time": local_time.strftime("%H:%M"), # Bây giờ giờ sẽ hiển thị chuẩn!
            "question": h.question,
            "answer": h.answer,
            "status": h.status
        })
    return result