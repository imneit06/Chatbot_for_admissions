from datetime import datetime
from html import escape
from pathlib import Path
import gc
import logging
from threading import Lock

from app.db.session import SessionLocal
from app.models.knowledge_document import KnowledgeDocument

logger = logging.getLogger(__name__)
knowledge_ingest_lock = Lock()

ROOT_DIR = Path(__file__).resolve().parents[3]
PDF_RAW_DIR = ROOT_DIR / "data" / "raw" / "pdf"
HTML_RAW_DIR = ROOT_DIR / "data" / "raw" / "html"
TEXT_RAW_DIR = ROOT_DIR / "data" / "raw" / "text"


def ensure_knowledge_directories():
    PDF_RAW_DIR.mkdir(parents=True, exist_ok=True)
    HTML_RAW_DIR.mkdir(parents=True, exist_ok=True)
    TEXT_RAW_DIR.mkdir(parents=True, exist_ok=True)


def text_to_html(text: str, title: str) -> str:
    escaped_title = escape(title)
    escaped_body = escape(text)
    return (
        "<!doctype html>\n"
        "<html lang=\"vi\">\n"
        "<head><meta charset=\"utf-8\"><title>"
        f"{escaped_title}"
        "</title></head>\n"
        "<body>\n"
        f"<h1>{escaped_title}</h1>\n"
        f"<pre style=\"white-space: pre-wrap; font-family: sans-serif;\">{escaped_body}</pre>\n"
        "</body>\n"
        "</html>\n"
    )


def reset_cached_retrieval(reset_bm25: bool = True):
    try:
        from rag_app.rag.retriever import reset_retrieval_cache

        reset_retrieval_cache(reset_bm25=reset_bm25)
        gc.collect()
    except Exception:
        logger.exception("[Knowledge ingest] failed to reset retrieval cache")


def rebuild_bm25_index():
    try:
        from rag_app.search.bm25_index import rebuild_bm25_indexer

        rebuild_bm25_indexer()
    except Exception:
        logger.exception("[Knowledge ingest] failed to rebuild BM25 index")
        raise


def refresh_retrieval_after_rebuild():
    rebuild_bm25_index()
    reset_cached_retrieval(reset_bm25=False)


def run_knowledge_ingest(document_id: int):
    db = SessionLocal()
    doc = db.get(KnowledgeDocument, document_id)

    if not doc:
        db.close()
        return

    doc.status = "processing"
    doc.error_message = None
    doc.updated_at = datetime.utcnow()
    db.commit()

    try:
        with knowledge_ingest_lock:
            ensure_knowledge_directories()
            reset_cached_retrieval()

            logger.warning("[Knowledge ingest] start prepare for document_id=%s", document_id)
            from rag_app.indexing.pipeline import run_prepare_multivector

            run_prepare_multivector()
            logger.warning("[Knowledge ingest] finish prepare for document_id=%s", document_id)

            logger.warning("[Knowledge ingest] start ingest for document_id=%s", document_id)
            from scripts.ingest_multivector import ingest

            ingest()
            logger.warning("[Knowledge ingest] finish ingest for document_id=%s", document_id)
            refresh_retrieval_after_rebuild()

        doc.status = "indexed"
        doc.indexed_at = datetime.utcnow()
        doc.error_message = None
    except Exception as exc:
        logger.exception("[Knowledge ingest] failed for document_id=%s", document_id)
        doc.status = "failed"
        doc.error_message = str(exc)
    finally:
        doc.updated_at = datetime.utcnow()
        db.commit()
        db.close()


def run_knowledge_rebuild_after_delete(document_id: int):
    db = SessionLocal()
    doc = db.get(KnowledgeDocument, document_id)

    try:
        with knowledge_ingest_lock:
            ensure_knowledge_directories()
            reset_cached_retrieval()
            logger.warning("[Knowledge ingest] rebuild after delete document_id=%s", document_id)

            from rag_app.indexing.pipeline import run_prepare_multivector
            from scripts.ingest_multivector import ingest

            run_prepare_multivector()
            ingest()
            refresh_retrieval_after_rebuild()

        if doc:
            doc.error_message = None
            doc.updated_at = datetime.utcnow()
    except Exception as exc:
        logger.exception("[Knowledge ingest] rebuild after delete failed document_id=%s", document_id)
        if doc:
            doc.error_message = str(exc)
            doc.updated_at = datetime.utcnow()
    finally:
        db.commit()
        db.close()
