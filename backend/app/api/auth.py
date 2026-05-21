from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, Token
from app.core.security import get_password_hash, verify_password, create_access_token, require_admin

router = APIRouter()

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Kiểm tra email đã tồn tại chưa
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="Email này đã được đăng ký trong hệ thống."
        )
    
    # 2. Băm mật khẩu và tạo User mới (Ép role='user' để bảo mật)
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role="user" 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. Tạo token đăng nhập luôn sau khi đăng ký thành công
    user_data = {"id": new_user.id, "name": new_user.name, "email": new_user.email, "role": new_user.role}
    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role})

    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    # 1. Tìm user theo email
    user = db.query(User).filter(User.email == user_in.email).first()
    
    # 2. Kiểm tra tài khoản và mật khẩu
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Tài khoản này đã bị khóa")


    # 3. Tạo token
    user_data = {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
    access_token = create_access_token(data={"sub": user.email, "role": user.role})

    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Lấy danh sách toàn bộ người dùng"""
    users = db.query(User).all()
    # Ẩn password hash trước khi trả về
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "is_active": u.is_active} for u in users]

@router.put("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Khóa hoặc Mở khóa tài khoản"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Admin không thể tự khóa tài khoản của mình")
    
    # Đảo ngược trạng thái (Đang True thành False, False thành True)
    user.is_active = not user.is_active
    db.commit()
    return {"message": "Cập nhật thành công", "is_active": user.is_active}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Xóa vĩnh viễn tài khoản"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Admin không thể tự xóa tài khoản của mình")
    
    db.delete(user)
    db.commit()
    return {"message": "Đã xóa người dùng thành công"}
