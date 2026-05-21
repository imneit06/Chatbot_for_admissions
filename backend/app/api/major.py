from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.major import Major
from app.schemas.major import MajorCreate, MajorResponse
from app.core.security import require_admin
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=list[MajorResponse])
def get_majors(db: Session = Depends(get_db)):
    return db.query(Major).all()

@router.post("/", response_model=MajorResponse)
def create_major(
    major: MajorCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    db_major = db.query(Major).filter(Major.code == major.code).first()
    if db_major:
        raise HTTPException(status_code=400, detail="Mã ngành này đã tồn tại!")
    
    new_major = Major(**major.model_dump())
    db.add(new_major)
    db.commit()
    db.refresh(new_major)
    return new_major

@router.put("/{major_id}", response_model=MajorResponse)
def update_major(
    major_id: int,
    major_in: MajorCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    major = db.query(Major).filter(Major.id == major_id).first()

    if not major:
        raise HTTPException(status_code=404, detail="Không tìm thấy ngành học")

    duplicate = db.query(Major).filter(
        Major.code == major_in.code,
        Major.id != major_id,
    ).first()

    if duplicate:
        raise HTTPException(status_code=400, detail="Mã ngành này đã tồn tại!")

    for field, value in major_in.model_dump().items():
        setattr(major, field, value)

    db.commit()
    db.refresh(major)
    return major

@router.delete("/{major_id}")
def delete_major(
    major_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    major = db.query(Major).filter(Major.id == major_id).first()
    if not major:
        raise HTTPException(status_code=404, detail="Không tìm thấy ngành học")
    db.delete(major)
    db.commit()
    return {"message": "Đã xóa thành công"}
