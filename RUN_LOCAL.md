# Run Local

## Requirements

- Python 3.11 recommended. This workspace was checked with Python 3.11.9.
- Node.js 24 was used in this workspace. Node.js 20 LTS or newer is recommended for the Vite frontend.
- npm 11 was used in this workspace.

## Activate Venv

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
source .venv/bin/activate
```

## Install

Backend and RAG dependencies, from the repository root:

```bash
python -m pip install -r requirements.txt
pip check
```

Frontend dependencies:

```bash
cd frontend
npm install
```

## Env Setup

Backend/RAG reads `.env` from the repository root. Create it from `.env.example` when needed:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Do not commit real API keys. `GOOGLE_API_KEY` is only required when calling the Gemini-backed chat flow.

Frontend env:

```powershell
cd frontend
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cd frontend
cp .env.example .env
```

Default value:

```env
VITE_API_URL=http://localhost:8000
```

If backend must run on another port, update `frontend/.env` accordingly.

## Run Backend

Recommended from the repository root on Windows PowerShell:

```powershell
cd backend
$env:PYTHONPATH="D:\GitHub\SE104"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Portable Windows form, replace the path with your repo path:

```powershell
cd backend
$env:PYTHONPATH=(Resolve-Path ..).Path
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Linux/macOS:

```bash
cd backend
PYTHONPATH="$(pwd)/.." python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend imports `app.*` from `backend/` and `rag_app.*` from the repository root, so `PYTHONPATH` must include the repository root when running from `backend`.

SQLite is stored at `backend/uit_chatbot.db` regardless of the current working directory.

If Windows refuses port 8000, use a fallback port:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Then set `frontend/.env`:

```env
VITE_API_URL=http://localhost:8001
```

## Run Frontend

```bash
cd frontend
npm run dev
```

Because `vite.config.js` sets `base: "/Chatbot_for_admissions/"`, Vite opens the app at:

```text
http://localhost:5173/Chatbot_for_admissions/
```

## Smoke Test

Backend:

```bash
curl http://localhost:8000/
curl http://localhost:8000/docs
curl http://localhost:8000/api/v1/majors/
```

Frontend pages:

```text
/login
/chat
/lookup
/history
/admin
```

Manual flow:

1. Open `/login`.
2. Register a new user.
3. Login.
4. Open `/chat`, `/lookup`, and `/history`.
5. Logout.
6. Login as admin if the seeded admin exists.
7. Open `/admin`.

Seeded admin:

```text
Email: admin@uit.edu.vn
Password: admin123456
```

## Seed UIT Majors

From the repository root:

```bash
python scripts/seed_uit_majors.py
```

The script is idempotent and upserts majors by `code`.

## Admin Knowledge Upload

1. Login as admin.
2. Open `/admin`.
3. Select `Tri thức Chatbot`.
4. Upload a PDF, HTML, TXT, or MD file.
5. Wait until the document status becomes `indexed`.
6. Open `/chat` and ask a question related to the uploaded document.

TXT and MD uploads are converted to simple HTML for the current RAG pipeline.

## Known Issues

- `/api/v1/chat/` may return an error until RAG data is prepared and ingested.
- Missing `GOOGLE_API_KEY` will make Gemini chat calls fail, but backend startup should still work.
- If the machine does not have CUDA, use `EMBEDDING_DEVICE=cpu`.
- If you see `Torch not compiled with CUDA enabled`, set `EMBEDDING_DEVICE=cpu` in the root `.env`.
- Admin Knowledge upload rebuilds the full index from raw documents in this phase. Incremental indexing and granular Chroma delete are TODOs for a later RAG phase.
- If frontend calls the wrong backend URL, check `frontend/.env` and `VITE_API_URL`.
- In this workspace, backend startup succeeded on port 8001. Port 8000 was blocked by Windows with `Errno 13`; use another port if that happens locally.

## RAG Test Later

Prepare and ingest RAG data later with:

```bash
python scripts/prepare_multivector_docs.py
python scripts/ingest_multivector.py
```

The RAG pipeline logic was not changed for this local smoke-check task.
