from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class KnowledgeDocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_path: str
    file_type: str
    source_type: str
    status: str
    error_message: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    indexed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class KnowledgeStatusResponse(BaseModel):
    total: int
    indexed: int
    processing: int
    failed: int
    uploaded: int
    deleted: int
