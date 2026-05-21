from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.api import admin, auth, chat, knowledge, major
from app.db.session import engine, Base, SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

# Tạo bảng DB
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UIT Admission Chatbot API")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "*" # (Dấu * nghĩa là cho phép mọi trang web gọi API. Tạm thời dùng cái này để lúc deploy lên Github Pages không bị lỗi CORS chặn lại)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE SEEDING (TẠO ADMIN MẶC ĐỊNH) ---
@app.on_event("startup")
def create_default_admin():
    db: Session = SessionLocal()
    admin_email = "admin@uit.edu.vn"
    admin_exists = db.query(User).filter(User.email == admin_email).first()
    
    if not admin_exists:
        admin_user = User(
            name="Admin",
            email=admin_email,
            hashed_password=get_password_hash("admin123456"), # Mật khẩu khởi tạo
            role="admin"
        )
        db.add(admin_user)
        db.commit()
    db.close()
# --------------------------------------------

# Đăng ký Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(major.router, prefix="/api/v1/majors", tags=["majors"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(knowledge.router, prefix="/api/v1/knowledge", tags=["knowledge"])

@app.get("/")
def read_root():
    return {"message": "Welcome to UIT Admission Backend API"}
