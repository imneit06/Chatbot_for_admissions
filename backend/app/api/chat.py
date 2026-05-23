from datetime import timedelta
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.chat_history import ChatHistory
from app.models.major import Major
from rag_app.rag.chain import answer_question
from rag_app.rag.retriever import is_retrieval_index_ready

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str
    user_id: str


class ChatResponse(BaseModel):
    reply: str
    status: str
    sources: list[dict[str, Any]] = []


def is_major_question(message: str) -> bool:
    normalized = message.lower()
    keywords = ["ngành", "nganh", "chuyên ngành", "chuyen nganh", "chương trình", "chuong trinh"]
    return any(keyword in normalized for keyword in keywords)


def build_major_fallback_reply(db: Session) -> str:
    majors = db.query(Major).order_by(Major.name.asc()).all()

    if not majors:
        return "Hiện chưa có dữ liệu ngành học trong hệ thống."

    lines = ["Hiện hệ thống có các ngành sau:"]
    for major in majors:
        code = f" ({major.code})" if major.code else ""
        lines.append(f"- {major.name}{code}")

    return "\n".join(lines)


def build_knowledge_not_ready_reply() -> str:
    return (
        "Hiện kho tri thức RAG chưa sẵn sàng. "
        "Vui lòng vào trang Admin để upload tài liệu tuyển sinh rồi chạy re-index/ingest."
    )


def is_llm_quota_error(error: Exception) -> bool:
    message = str(error).lower()
    return (
        "resourceexhausted" in message
        or "quota exceeded" in message
        or "429" in message
        or "generate_content_free_tier_requests" in message
    )


def build_llm_quota_reply() -> str:
    return (
        "Gemini API hiện đã hết quota miễn phí cho hôm nay nên chatbot chưa thể sinh câu trả lời mới. "
        "Bạn có thể chờ quota được reset, đổi API key/project khác, hoặc bật billing/tăng hạn mức. "
        "Để tiết kiệm quota cho lần chạy sau, nên tắt QUESTION_REWRITE_ENABLED và RERANKER_ENABLED."
    )


def llm_quota_response(request: ChatRequest, db: Session) -> ChatResponse:
    reply_text = build_llm_quota_reply()
    status = "Hết quota Gemini"
    save_chat_history(db, request.user_id, request.message, reply_text, status)
    return ChatResponse(reply=reply_text, status=status, sources=[])


def fallback_response(request: ChatRequest, db: Session) -> ChatResponse:
    if is_major_question(request.message):
        reply_text = build_major_fallback_reply(db)
        status = "Trả lời từ dữ liệu ngành học"
    else:
        reply_text = build_knowledge_not_ready_reply()
        status = "Kho tri thức chưa sẵn sàng"

    save_chat_history(db, request.user_id, request.message, reply_text, status)

    return ChatResponse(reply=reply_text, status=status, sources=[])


def save_chat_history(db: Session, user_id: str, question: str, answer: str, status: str) -> None:
    chat_history = ChatHistory(
        user_id=str(user_id),
        question=question,
        answer=answer,
        status=status,
    )
    db.add(chat_history)
    db.commit()


@router.post("/", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    if not is_retrieval_index_ready():
        return fallback_response(request, db)

    try:
        result = answer_question(
            question=request.message,
            session_id=str(request.user_id),
        )

        reply_text = result.get("answer", "")
        sources = result.get("sources", [])
        status = "Đã trả lời"

        save_chat_history(db, request.user_id, request.message, reply_text, status)

        return ChatResponse(
            reply=reply_text,
            status=status,
            sources=sources,
        )

    except Exception as exc:
        logger.exception("Chat endpoint failed")
        if is_llm_quota_error(exc):
            return llm_quota_response(request, db)
        return fallback_response(request, db)


@router.get("/history/{user_id}")
def get_user_history(user_id: str, db: Session = Depends(get_db)):
    histories = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.created_at.desc())
        .all()
    )

    result = []
    for history in histories:
        local_time = history.created_at + timedelta(hours=7)

        result.append(
            {
                "id": history.id,
                "created_at": local_time.isoformat(),
                "date": local_time.strftime("%d/%m/%Y"),
                "time": local_time.strftime("%H:%M"),
                "question": history.question,
                "answer": history.answer,
                "status": history.status,
            }
        )

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
