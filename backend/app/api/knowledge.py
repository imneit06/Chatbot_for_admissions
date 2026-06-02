from datetime import datetime
from pathlib import Path
import re
import shutil
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.knowledge_document import KnowledgeDocument
from app.models.user import User
from app.schemas.knowledge import KnowledgeDocumentResponse, KnowledgeStatusResponse
from app.services.knowledge_ingest_service import (
    HTML_RAW_DIR,
    PDF_RAW_DIR,
    TEXT_RAW_DIR,
    ensure_knowledge_directories,
    run_knowledge_ingest,
    run_knowledge_rebuild_after_delete,
    text_to_html,
)

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".html", ".htm", ".txt", ".md"}
TEXT_EXTENSIONS = {".txt", ".md"}
PROCESSING_STATUSES = {"uploaded", "processing"}


def sanitize_filename(filename: str) -> str:
    stem = Path(filename).stem or "document"
    safe_stem = re.sub(r"[^a-zA-Z0-9_.-]+", "_", stem).strip("._") or "document"
    return safe_stem[:80]


def get_destination(original_filename: str) -> tuple[str, str, Path]:
    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ file .pdf, .html, .htm, .txt, .md",
        )

    safe_stem = sanitize_filename(original_filename)
    unique_stem = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}_{safe_stem}"

    if extension == ".pdf":
        return "pdf", f"{unique_stem}.pdf", PDF_RAW_DIR / f"{unique_stem}.pdf"

    if extension in {".html", ".htm"}:
        return "html", f"{unique_stem}.html", HTML_RAW_DIR / f"{unique_stem}.html"

    return extension.lstrip("."), f"{unique_stem}.html", HTML_RAW_DIR / f"{unique_stem}.html"


def remove_document_files(document: KnowledgeDocument):
    paths = [Path(document.file_path)]

    if document.file_type in {"txt", "md"}:
        paths.append(TEXT_RAW_DIR / f"{Path(document.filename).stem}.{document.file_type}")

    allowed_roots = [
        PDF_RAW_DIR.resolve(),
        HTML_RAW_DIR.resolve(),
        TEXT_RAW_DIR.resolve(),
    ]

    for file_path in paths:
        resolved_file = file_path.resolve()
        if any(resolved_file.is_relative_to(root) for root in allowed_roots) and resolved_file.exists():
            resolved_file.unlink()


@router.get("/documents", response_model=list[KnowledgeDocumentResponse])
def list_documents(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    query = db.query(KnowledgeDocument)

    if status:
        query = query.filter(KnowledgeDocument.status == status)

    return query.order_by(KnowledgeDocument.created_at.desc()).all()


@router.post("/upload", response_model=KnowledgeDocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    ensure_knowledge_directories()

    file_type, stored_filename, destination = get_destination(file.filename or "document")
    original_extension = Path(file.filename or "").suffix.lower()

    try:
        if original_extension in TEXT_EXTENSIONS:
            raw_text = (await file.read()).decode("utf-8")
            TEXT_RAW_DIR.mkdir(parents=True, exist_ok=True)
            original_text_path = TEXT_RAW_DIR / f"{Path(stored_filename).stem}{original_extension}"
            original_text_path.write_text(raw_text, encoding="utf-8")
            destination.write_text(text_to_html(raw_text, file.filename or stored_filename), encoding="utf-8")
        else:
            with destination.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File text/markdown cần dùng UTF-8.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không thể lưu file upload: {exc}")
    finally:
        await file.close()

    document = KnowledgeDocument(
        filename=stored_filename,
        original_filename=file.filename or stored_filename,
        file_path=str(destination),
        file_type=file_type,
        source_type="upload",
        status="processing",
        uploaded_by=current_admin.id,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    background_tasks.add_task(run_knowledge_ingest, document.id)
    return document


@router.post("/documents/{document_id}/reindex", response_model=KnowledgeDocumentResponse)
def reindex_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    document = db.get(KnowledgeDocument, document_id)

    if not document:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu tri thức.")

    if document.status == "deleted":
        raise HTTPException(status_code=400, detail="Không thể cập nhật lại tài liệu đã xóa.")

    if document.status in PROCESSING_STATUSES:
        raise HTTPException(status_code=400, detail="Tài liệu này đang được xử lý.")

    document.status = "processing"
    document.error_message = None
    document.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(document)

    background_tasks.add_task(run_knowledge_ingest, document.id)
    return document


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    document = db.get(KnowledgeDocument, document_id)

    if not document:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu tri thức.")

    try:
        remove_document_files(document)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không thể xóa file vật lý: {exc}")

    document.status = "deleted"
    document.updated_at = datetime.utcnow()
    db.commit()

    background_tasks.add_task(run_knowledge_rebuild_after_delete, document.id)

    return {"message": "Đã xóa tài liệu khỏi kho tri thức."}


@router.get("/status", response_model=KnowledgeStatusResponse)
def get_knowledge_status(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return {
        "total": db.query(KnowledgeDocument).count(),
        "indexed": db.query(KnowledgeDocument).filter(KnowledgeDocument.status == "indexed").count(),
        "processing": db.query(KnowledgeDocument).filter(KnowledgeDocument.status == "processing").count(),
        "failed": db.query(KnowledgeDocument).filter(KnowledgeDocument.status == "failed").count(),
        "uploaded": db.query(KnowledgeDocument).filter(KnowledgeDocument.status == "uploaded").count(),
        "deleted": db.query(KnowledgeDocument).filter(KnowledgeDocument.status == "deleted").count(),
    }
