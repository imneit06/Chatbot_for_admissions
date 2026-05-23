import logging
import time

from langchain_google_genai import ChatGoogleGenerativeAI

from rag_app.core.config import (
    GEMINI_MODEL,
    LLM_TEMPERATURE,
    MEMORY_MAX_RECENT_TURNS,
    MEMORY_SUMMARY_TRIGGER_TURNS,
    QUESTION_REWRITE_ENABLED,
    RETRIEVAL_TOP_K,
)
from rag_app.core.prompts import (
    SYSTEM_PROMPT,
    RAG_PROMPT_TEMPLATE,
    REWRITE_PROMPT_TEMPLATE,
    MEMORY_SUMMARY_PROMPT_TEMPLATE,
)
from rag_app.rag.retriever import retrieve_docs, format_context, format_sources
from rag_app.rag.memory import FileChatMemoryStore, format_messages


logger = logging.getLogger(__name__)
memory_store = FileChatMemoryStore()
_llm = None


def elapsed_ms(start: float) -> float:
    return (time.perf_counter() - start) * 1000


def log_timing(session_id: str, step: str, start: float, **extra):
    extra_text = " ".join(f"{key}={value}" for key, value in extra.items())
    logger.warning(
        "[RAG timing] session=%s step=%s ms=%.1f %s",
        session_id,
        step,
        elapsed_ms(start),
        extra_text,
    )


def build_llm():
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            temperature=LLM_TEMPERATURE,
        )
    return _llm


def warm_up_llm():
    build_llm()


def clear_llm_cache():
    global _llm
    _llm = None


def should_rewrite_question(question: str, session: dict) -> bool:
    if not QUESTION_REWRITE_ENABLED:
        return False

    messages = session.get("messages", [])

    if not messages:
        return False

    q = question.lower().strip()

    followup_markers = [
        "ngành đó",
        "cái đó",
        "cái này",
        "vậy",
        "vậy còn",
        "nó",
        "trường này",
        "phần đó",
        "mấy môn đó",
        "bao nhiêu tín chỉ",
        "còn",
        "thì sao",
        "như thế nào",
    ]

    if any(marker in q for marker in followup_markers):
        return True

    clear_keywords = [
        "khoa học máy tính",
        "công nghệ thông tin",
        "kỹ thuật phần mềm",
        "hệ thống thông tin",
        "điểm chuẩn",
        "phương thức xét tuyển",
        "chỉ tiêu",
        "chương trình đào tạo",
    ]

    # Nếu câu hỏi đã có keyword rất rõ thì không cần rewrite
    if any(keyword in q for keyword in clear_keywords):
        return False

    # Nếu có history nhưng câu hỏi không rõ ràng, vẫn rewrite
    return True


def rewrite_question(question: str, session_id: str) -> str:
    session = memory_store.load(session_id)

    if not should_rewrite_question(question, session):
        return question

    memory_summary, recent_chat_history = memory_store.get_memory_parts(session_id)

    prompt = REWRITE_PROMPT_TEMPLATE.format(
        memory_summary=memory_summary,
        recent_chat_history=recent_chat_history,
        question=question,
    )

    llm = build_llm()
    response = llm.invoke(prompt)

    rewritten = response.content.strip()

    if not rewritten:
        return question

    # Tránh trường hợp model trả lời dài hoặc lỡ giải thích.
    first_line = rewritten.splitlines()[0].strip()

    return first_line if first_line else question


def maybe_summarize_memory(session_id: str):
    session = memory_store.load(session_id)
    messages = session.get("messages", [])

    trigger_messages = MEMORY_SUMMARY_TRIGGER_TURNS * 2
    keep_messages = MEMORY_MAX_RECENT_TURNS * 2

    if len(messages) <= trigger_messages:
        return

    old_messages = messages[:-keep_messages]
    recent_messages = messages[-keep_messages:]

    if not old_messages:
        return

    old_summary = session.get("summary", "").strip()
    old_chat_history = format_messages(old_messages)

    prompt = MEMORY_SUMMARY_PROMPT_TEMPLATE.format(
        old_summary=old_summary or "Chưa có tóm tắt cũ.",
        old_chat_history=old_chat_history,
    )

    llm = build_llm()
    response = llm.invoke(prompt)

    new_summary = response.content.strip()

    if not new_summary:
        return

    session["summary"] = new_summary
    session["messages"] = recent_messages

    memory_store.save(session_id, session)


def answer_question(
    question: str,
    session_id: str = "default",
):
    """
    RAG chain có memory.

    Bước xử lý:
    1. Load memory theo session_id
    2. Rewrite question nếu là follow-up
    3. Retrieve bằng standalone_question
    4. Generate answer bằng context + memory
    5. Save user/assistant message
    6. Summarize memory nếu history dài
    """

    total_start = time.perf_counter()

    step_start = time.perf_counter()
    standalone_question = rewrite_question(
        question=question,
        session_id=session_id,
    )
    log_timing(
        session_id,
        "rewrite_question",
        step_start,
        changed=standalone_question != question,
    )

    step_start = time.perf_counter()
    docs, metadata_filter = retrieve_docs(
        standalone_question,
        k=RETRIEVAL_TOP_K,
    )
    log_timing(session_id, "retrieve_docs", step_start, docs=len(docs))

    step_start = time.perf_counter()
    context = format_context(docs)
    log_timing(session_id, "format_context", step_start, context_chars=len(context))

    step_start = time.perf_counter()
    memory_summary, recent_chat_history = memory_store.get_memory_parts(session_id)
    log_timing(
        session_id,
        "load_memory",
        step_start,
        summary_chars=len(memory_summary),
        history_chars=len(recent_chat_history),
    )

    step_start = time.perf_counter()
    prompt = (
        SYSTEM_PROMPT
        + "\n\n"
        + RAG_PROMPT_TEMPLATE.format(
            memory_summary=memory_summary,
            recent_chat_history=recent_chat_history,
            context=context,
            question=question,
            standalone_question=standalone_question,
        )
    )
    log_timing(session_id, "build_prompt", step_start, prompt_chars=len(prompt))

    step_start = time.perf_counter()
    llm = build_llm()
    log_timing(session_id, "get_llm", step_start)

    step_start = time.perf_counter()
    response = llm.invoke(prompt)
    log_timing(session_id, "gemini_generate", step_start)

    answer = response.content

    step_start = time.perf_counter()
    memory_store.append_message(
        session_id=session_id,
        role="user",
        content=question,
    )

    memory_store.append_message(
        session_id=session_id,
        role="assistant",
        content=answer,
    )
    log_timing(session_id, "save_memory", step_start, answer_chars=len(answer))

    step_start = time.perf_counter()
    maybe_summarize_memory(session_id)
    log_timing(session_id, "maybe_summarize_memory", step_start)
    log_timing(session_id, "total", total_start)

    return {
        "answer": answer,
        "question": question,
        "standalone_question": standalone_question,
        "filter": metadata_filter,
        "sources": format_sources(docs),
        "session_id": session_id,
    }


def clear_memory(session_id: str = "default"):
    memory_store.clear(session_id)
