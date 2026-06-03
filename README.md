# UIT Admission Chatbot

Ứng dụng chatbot tư vấn tuyển sinh UIT, được xây dựng cho đồ án môn **SE104 - Nhập môn Công nghệ Phần mềm**. Hệ thống kết hợp giao diện React/Vite, backend FastAPI và pipeline RAG để trả lời câu hỏi từ dữ liệu tuyển sinh, chương trình đào tạo và dữ liệu ngành học.

## Thành viên

- Nguyễn Xuân Tiến - 24521778
- Phan Tấn Tiến - 24521780
- Phạm Hồ Hữu Trí - 24521841

## Tính năng chính

- Trang giới thiệu, đăng ký, đăng nhập và phân quyền người dùng.
- Chatbot hỏi đáp tuyển sinh có lưu lịch sử theo tài khoản.
- RAG trả lời từ tài liệu đã ingest, kèm danh sách nguồn tham khảo.
- Tra cứu danh sách ngành học, học phí, tổ hợp xét tuyển và mô tả ngành.
- Trang quản trị cho admin:
  - xem thống kê hệ thống;
  - quản lý người dùng;
  - thêm, sửa, xóa ngành học;
  - upload tài liệu tri thức `.pdf`, `.html`, `.htm`, `.txt`, `.md`;
  - theo dõi trạng thái index, re-index và xóa tài liệu.
- Hybrid retrieval kết hợp Chroma vector search, BM25 keyword search và Reciprocal Rank Fusion.
- Hỗ trợ memory hội thoại, rewrite câu hỏi follow-up, warm-up RAG và optional reranker.

## Tech stack

| Lớp | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Framer Motion, Axios, Lucide React |
| Backend | FastAPI, SQLAlchemy, Pydantic, PyJWT, bcrypt |
| Database app | SQLite local tại `backend/uit_chatbot.db` |
| LLM | Gemini qua `langchain-google-genai` |
| Embedding | `BAAI/bge-m3` qua `langchain-huggingface` |
| Vector store | ChromaDB |
| Keyword search | BM25 với `rank-bm25` và `underthesea` |
| Parsing tài liệu | pdfplumber, pypdf, BeautifulSoup, lxml, Pillow, pytesseract |
| Container | Docker, Docker Compose |

## Cấu trúc thư mục

```text
Chatbot_for_admissions/
├── backend/
│   ├── app/
│   │   ├── api/                 # FastAPI routers: auth, chat, admin, knowledge, major
│   │   ├── core/                # security/auth helpers
│   │   ├── db/                  # SQLAlchemy engine/session
│   │   ├── models/              # User, Major, ChatHistory, KnowledgeDocument
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   └── services/            # seed ngành học, ingest knowledge
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/          # Navbar, route guards, error boundary
│       ├── context/             # AuthContext
│       ├── lib/                 # Axios API client
│       └── pages/               # Landing, Login, Chat, Lookup, History, Admin
├── rag_app/
│   ├── chunking/                # text/table/image chunking
│   ├── core/                    # config và prompt
│   ├── indexing/                # prepare parent/child JSONL
│   ├── loaders/                 # PDF/HTML loaders
│   ├── rag/                     # chain, retriever, memory, reranker
│   ├── search/                  # BM25 index
│   └── utils/
├── scripts/
│   ├── prepare_multivector_docs.py
│   ├── ingest_multivector.py
│   ├── seed_uit_majors.py
│   └── eval_retrieval.py
├── docs/                        # tài liệu đọc code và luồng RAG
├── data/                        # dữ liệu raw/processed, không commit dữ liệu thật
├── storage/                     # Chroma, BM25, memory runtime
├── docker-compose.yml
├── requirements.txt
├── RUN_LOCAL.md
└── README.md
```

## Luồng hoạt động tổng quát

```text
User
  -> React ChatPage
  -> POST /api/v1/chat/
  -> FastAPI chat_endpoint
  -> rag_app.rag.chain.answer_question()
  -> rewrite question nếu cần
  -> retrieve_docs()
       -> Chroma vector search
       -> BM25 keyword search
       -> RRF fusion
       -> optional reranker
  -> format context + prompt
  -> Gemini
  -> lưu memory file + ChatHistory SQL
  -> trả reply và sources về frontend
```

Admin upload tài liệu:

```text
AdminPage
  -> POST /api/v1/knowledge/upload
  -> lưu file vào data/raw
  -> KnowledgeDocument(status="processing")
  -> background task run_knowledge_ingest()
  -> prepare_multivector_docs
  -> ingest_multivector vào Chroma
  -> rebuild BM25
  -> KnowledgeDocument(status="indexed")
```

## Yêu cầu môi trường

- Python 3.10+; khuyến nghị Python 3.11.
- Node.js 20+; project đã chạy với Node.js 24.
- npm.
- Docker Desktop hoặc Docker Engine nếu chạy bằng Docker.
- Gemini API key nếu muốn dùng luồng chat LLM.
- CUDA là tùy chọn. Nếu máy không có GPU/CUDA, đặt `EMBEDDING_DEVICE=cpu`.

## Cài đặt local

### 1. Clone và vào project

```powershell
git clone <repository-url>
cd Chatbot_for_admissions
```

Nếu đã có sẵn source code, chỉ cần mở terminal tại thư mục gốc project:

```powershell
cd path\to\Chatbot_for_admissions
```

### 2. Cài dependencies Python

Từ thư mục gốc project:

```powershell
python -m pip install -r requirements.txt
python -m pip check
```

Nếu dùng virtual environment riêng trong project:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pip check
```

### 3. Cài dependencies frontend

```powershell
cd frontend
npm install
cd ..
```

### 4. Tạo file môi trường

Backend/RAG đọc `.env` từ thư mục gốc project:

```powershell
Copy-Item .env.example .env
```

Chỉnh các biến quan trọng trong `.env`:

```env
GOOGLE_API_KEY="your-gemini-api-key"
EMBEDDING_DEVICE=cpu
RAG_WARMUP_ENABLED=true
```

Frontend đọc API URL từ `frontend/.env`:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

Giá trị mặc định:

```env
VITE_API_URL=http://localhost:8000
```

## Chạy ứng dụng local

### 1. Chạy backend

Backend cần import được cả `backend/app` và `rag_app`, nên khi chạy từ thư mục `backend` cần set `PYTHONPATH` về root project.

```powershell
cd backend
$env:PYTHONPATH=(Resolve-Path ..).Path
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Nếu port `8000` bị chặn, đổi sang port khác:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Khi đổi port backend, cập nhật `frontend/.env`:

```env
VITE_API_URL=http://localhost:8001
```

### 2. Chạy frontend

Mở terminal mới:

```powershell
cd frontend
npm run dev
```

Do `frontend/vite.config.js` đang đặt `base: "/Chatbot_for_admissions/"`, URL local thường là:

```text
http://localhost:5173/Chatbot_for_admissions/
```

## Chạy bằng Docker Compose

Từ thư mục gốc project:

```powershell
docker-compose up --build
```

Các service mặc định:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

Dừng container:

```powershell
docker-compose down
```

## Tài khoản admin mặc định

Backend tự tạo admin mặc định khi startup nếu chưa có:

```text
Email: admin@uit.edu.vn
Password: admin123456
```

Đây là tài khoản demo. Nếu deploy thật, cần đổi mật khẩu hoặc thay cơ chế seed admin.

## Chuẩn bị dữ liệu ngành học

Seed danh sách ngành UIT:

```powershell
python scripts\seed_uit_majors.py
```

Script này idempotent, chạy lại nhiều lần sẽ upsert theo `code`.

## Chuẩn bị dữ liệu RAG

Luồng RAG cần các artifact sau:

- `data/processed/multivector_preview/parents.jsonl`
- `data/processed/multivector_preview/children.jsonl`
- `storage/chroma`
- `storage/bm25_index.pkl`

Nếu đã có tài liệu raw trong `data/raw/pdf` hoặc `data/raw/html`, chạy:

```powershell
python scripts\prepare_multivector_docs.py
python scripts\ingest_multivector.py
```

Nếu chưa có RAG index, endpoint chat sẽ fallback:

- câu hỏi về ngành học: trả lời từ bảng `Major`;
- câu hỏi khác: báo kho tri thức RAG chưa sẵn sàng.

## Upload tri thức từ trang Admin

1. Chạy backend và frontend.
2. Đăng nhập bằng tài khoản admin.
3. Vào trang `/admin`.
4. Mở tab tri thức chatbot.
5. Upload file `.pdf`, `.html`, `.htm`, `.txt`, hoặc `.md`.
6. Đợi trạng thái tài liệu chuyển thành `indexed`.
7. Vào `/chat` và hỏi câu liên quan đến tài liệu đã upload.

Ghi chú:

- TXT/MD được lưu bản gốc trong `data/raw/text` và được chuyển thành HTML đơn giản để pipeline hiện tại xử lý.
- Mỗi lần upload/reindex/delete hiện sẽ rebuild lại full RAG index từ các file raw còn lại.
- Rebuild được serialize bằng lock để tránh nhiều job ingest chạy chồng lên nhau.

## Biến môi trường quan trọng

| Biến | Ý nghĩa | Mặc định |
| --- | --- | --- |
| `GOOGLE_API_KEY` | API key Gemini | Không có |
| `GEMINI_MODEL` | Model LLM sinh câu trả lời | `gemini-2.5-flash` |
| `LLM_TEMPERATURE` | Độ sáng tạo của LLM | `0.2` |
| `EMBEDDING_MODEL_NAME` | Model embedding | `BAAI/bge-m3` |
| `EMBEDDING_DEVICE` | Thiết bị chạy embedding | `cpu`, có thể đặt `cuda` |
| `NORMALIZE_EMBEDDINGS` | Chuẩn hóa vector embedding | `true` |
| `CHROMA_COLLECTION_NAME` | Tên collection Chroma | `uit_admission_multivector` |
| `CHROMA_DISTANCE_METRIC` | Metric vector search | `cosine` |
| `RESET_INDEX` | Reset Chroma khi ingest | `true` |
| `CHUNK_SIZE` | Kích thước chunk text | `1200` |
| `CHUNK_OVERLAP` | Overlap giữa chunks | `120` |
| `RETRIEVAL_TOP_K` | Số document cuối đưa vào prompt | `5` |
| `RERANKER_ENABLED` | Bật/tắt CrossEncoder reranker | `false` |
| `QUESTION_REWRITE_ENABLED` | Rewrite câu hỏi follow-up | `true` |
| `RAG_WARMUP_ENABLED` | Warm-up embedding/vectorstore/docstore/BM25 khi startup | `false` trong code, có thể bật trong `.env` |
| `VITE_API_URL` | Backend URL cho frontend | `http://localhost:8000` |

Với `BAAI/bge-m3`, dense embedding dimension là `1024`. Nếu đổi sang embedding model khác, cần rebuild Chroma index.

## API overview

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/` | Health message cơ bản |
| `POST` | `/api/v1/auth/register` | Đăng ký user |
| `POST` | `/api/v1/auth/login` | Đăng nhập, nhận bearer token |
| `GET` | `/api/v1/auth/users` | Admin xem danh sách user |
| `PUT` | `/api/v1/auth/users/{user_id}/toggle-status` | Admin khóa/mở khóa user |
| `DELETE` | `/api/v1/auth/users/{user_id}` | Admin xóa user |
| `POST` | `/api/v1/chat/` | Gửi câu hỏi tới chatbot |
| `GET` | `/api/v1/chat/history/{user_id}` | Lấy lịch sử chat |
| `DELETE` | `/api/v1/chat/history/item/{history_id}` | Xóa một item lịch sử |
| `GET` | `/api/v1/majors/` | Lấy danh sách ngành |
| `POST` | `/api/v1/majors/` | Admin tạo ngành |
| `PUT` | `/api/v1/majors/{major_id}` | Admin cập nhật ngành |
| `DELETE` | `/api/v1/majors/{major_id}` | Admin xóa ngành |
| `GET` | `/api/v1/admin/stats` | Admin xem thống kê |
| `POST` | `/api/v1/admin/seed-majors` | Admin seed ngành UIT |
| `GET` | `/api/v1/knowledge/documents` | Admin xem tài liệu tri thức |
| `POST` | `/api/v1/knowledge/upload` | Admin upload tài liệu |
| `POST` | `/api/v1/knowledge/documents/{document_id}/reindex` | Admin re-index tài liệu |
| `DELETE` | `/api/v1/knowledge/documents/{document_id}` | Admin xóa tài liệu và rebuild index |
| `GET` | `/api/v1/knowledge/status` | Admin xem thống kê trạng thái tri thức |

Swagger UI khi backend chạy:

```text
http://localhost:8000/docs
```

## Lưu trữ runtime và Git

Các file sau là dữ liệu runtime, không nên commit lên GitHub:

- `.env`
- `backend/uit_chatbot.db`
- `uit_chatbot.db`
- `data/`
- `storage/`
- `storage/chroma`
- `storage/bm25_index.pkl`
- `storage/memory/*.json`

SQLite local được tạo tại `backend/uit_chatbot.db`. Với production, nên dùng PostgreSQL hoặc database managed thay vì commit SQLite.

## Troubleshooting

### Backend không import được `rag_app`

Đảm bảo đã set `PYTHONPATH` về root project khi chạy từ `backend`:

```powershell
$env:PYTHONPATH=(Resolve-Path ..).Path
```

### Máy không có CUDA

Đặt trong `.env`:

```env
EMBEDDING_DEVICE=cpu
```

### Chat báo kho tri thức chưa sẵn sàng

Chạy prepare và ingest:

```powershell
python scripts\prepare_multivector_docs.py
python scripts\ingest_multivector.py
```

Hoặc upload tài liệu từ trang Admin và đợi status `indexed`.

### Gemini hết quota hoặc thiếu API key

Kiểm tra:

```env
GOOGLE_API_KEY="your-gemini-api-key"
```

Nếu quota hết, có thể đổi key/project khác, chờ reset quota hoặc bật billing.

### Frontend gọi sai backend

Kiểm tra `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Sau khi đổi env, restart Vite dev server.

### Port `8000` bị chiếm

Chạy backend ở port khác:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Rồi cập nhật `frontend/.env`.

## Tài liệu bổ sung

- `RUN_LOCAL.md`: hướng dẫn chạy local chi tiết.
- `ADMIN_KNOWLEDGE_RAG.md`: ghi chú upload tri thức và RAG admin.
- `docs/READING_ORDER.md`: thứ tự đọc code theo luồng.
- `docs/RAG_DATA_FLOW.md`: giải thích data flow RAG.
- `docs/CODE_KNOWLEDGE_GRAPH.md`: bản đồ module và trách nhiệm.

## Ghi chú deploy

Có thể deploy frontend lên Vercel/GitHub Pages/Netlify và backend lên Render/Railway/Fly.io/VPS. Khi deploy thật cần chú ý:

- không đưa `GOOGLE_API_KEY` lên frontend;
- cấu hình CORS theo domain thật, không nên dùng `"*"` lâu dài;
- dùng database bền vững thay SQLite local;
- cần persistent storage hoặc chiến lược build artifact cho `storage/chroma`, BM25 và dữ liệu processed;
- nếu deploy frontend ở root domain, cân nhắc chỉnh `base` trong `frontend/vite.config.js`.

## License

Project phục vụ mục đích học tập và đồ án môn học.
