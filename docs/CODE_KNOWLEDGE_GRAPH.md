# Code Knowledge Graph

This repository is a UIT admissions RAG chatbot with:

- React/Vite frontend in `frontend/src`
- FastAPI backend in `backend/app`
- RAG pipeline in `rag_app`
- ingestion entrypoints in `backend/app/services/knowledge_ingest_service.py` and `scripts/ingest_multivector.py`
- processed and runtime RAG state under `data/processed`, `storage/chroma`, `storage/bm25_index.pkl`, and `storage/memory`
- SQLite application state at `backend/uit_chatbot.db`

## System Nodes

| Node | File(s) | Responsibility |
| --- | --- | --- |
| Frontend router | `frontend/src/App.jsx` | Routes `/chat`, `/history`, `/lookup`, `/admin`, `/login`; protects chat/history and admin pages. |
| API client | `frontend/src/lib/api.js` | Axios client, `VITE_API_URL` base URL, bearer token injection, auth redirect on 401/403. |
| Chat UI | `frontend/src/pages/ChatPage.jsx` | Sends user messages, renders answers, sources, copy/regenerate, suggested questions. |
| Admin UI | `frontend/src/pages/AdminPage.jsx` | Manages stats, users, majors, and knowledge documents. Knowledge tab uploads, polls, reindexes, deletes. |
| FastAPI app | `backend/app/main.py` | Creates DB tables, seeds default admin, optionally warms RAG, registers routers. |
| Chat route | `backend/app/api/chat.py` | Receives chat request, checks index readiness, calls RAG chain, saves SQL chat history, handles fallbacks. |
| Knowledge route | `backend/app/api/knowledge.py` | Admin-only upload/list/status/reindex/delete endpoints. Saves files and schedules ingestion background tasks. |
| Admin route | `backend/app/api/admin.py` | Admin-only system stats and major seeding. |
| Major route | `backend/app/api/major.py` | CRUD/lookup for structured major data used by lookup pages and chat fallback. |
| Auth route | `backend/app/api/auth.py` | Login/register/user management; supplies bearer auth model used by admin APIs. |
| Knowledge model | `backend/app/models/knowledge_document.py` | Tracks uploaded document filename, path, type, status, errors, uploader, timestamps. |
| Chat history model | `backend/app/models/chat_history.py` | Stores question, answer, status, user id for history pages and admin stats. |
| DB session | `backend/app/db/session.py` | SQLite engine/session at `backend/uit_chatbot.db`. |
| Ingestion service | `backend/app/services/knowledge_ingest_service.py` | Serializes ingestion with a lock, rebuilds processed JSONL, Chroma, BM25, and retriever caches. |
| Indexing pipeline | `rag_app/indexing/pipeline.py` | Loads raw PDF/HTML, builds parent documents and child chunks, writes `parents.jsonl` and `children.jsonl`. |
| PDF loader | `rag_app/loaders/pdf_loader.py` | Extracts per-page text, tables, images from PDFs. |
| HTML loader | `rag_app/loaders/html_loader.py` | Extracts HTML text, tables, images; helpers can download/OCR relevant images. |
| Text chunker | `rag_app/chunking/text_chunker.py` | Splits text into child chunks and labels chunk quality. |
| Table chunker | `rag_app/chunking/table_chunker.py` | Creates table summaries and grouped row child chunks. |
| Image chunker | `rag_app/chunking/image_chunker.py` | Creates image metadata/OCR child chunks when images look relevant. |
| Vector ingestion | `scripts/ingest_multivector.py` | Loads JSONL children, embeds them with HuggingFace, inserts into Chroma, resets collection if configured. |
| Retriever | `rag_app/rag/retriever.py` | Builds embeddings/vectorstore/docstore, plans queries, retrieves via Chroma and BM25, fuses/reranks, formats context and sources. |
| BM25 index | `rag_app/search/bm25_index.py` | Tokenizes child chunks with `underthesea`, indexes with BM25, returns parent ids. |
| RAG chain | `rag_app/rag/chain.py` | Rewrites follow-up questions, retrieves docs, builds prompt, calls Gemini, saves file memory, returns answer/sources. |
| Prompts | `rag_app/core/prompts.py` | Context-only system prompt, RAG prompt, question rewrite prompt, memory summary prompt. |
| Memory | `rag_app/rag/memory.py` | File-backed session memory in `MEMORY_DIR`, used for rewrite and prompt context. |
| Config | `rag_app/core/config.py` | Loads `.env`, resolves paths, models, chunking, retrieval, reranker, warm-up, memory settings. |

## Primary Edges

```text
ChatPage.jsx
  -> api.post("/api/v1/chat/")
  -> backend/app/api/chat.py:chat_endpoint
  -> rag_app/rag/chain.py:answer_question
  -> rag_app/rag/retriever.py:retrieve_docs
  -> Chroma vectorstore + BM25 index + parent docstore
  -> rag_app/rag/retriever.py:format_context / format_sources
  -> rag_app/core/prompts.py
  -> ChatGoogleGenerativeAI
  -> FileChatMemoryStore + ChatHistory SQL row
  -> ChatPage.jsx renders reply and sources
```

```text
AdminPage.jsx KnowledgeTab
  -> api.post("/api/v1/knowledge/upload")
  -> backend/app/api/knowledge.py:upload_document
  -> raw file saved under data/raw/pdf, data/raw/html, or data/raw/text
  -> KnowledgeDocument(status="processing")
  -> BackgroundTasks.run_knowledge_ingest(document.id)
  -> rag_app/indexing/pipeline.py:run_prepare_multivector
  -> text/table/image child records + parent records
  -> data/processed/multivector_preview/{parents.jsonl, children.jsonl}
  -> scripts/ingest_multivector.py:ingest
  -> HuggingFaceEmbeddings -> Chroma
  -> rag_app/search/bm25_index.py:rebuild_bm25_indexer
  -> retriever caches reset
  -> KnowledgeDocument(status="indexed")
```

## Chat Data Flow

1. `ChatPage.jsx` maintains local `messages`, `input`, and `isLoading` state.
2. `sendMessage()` appends the user message optimistically and posts `{ message, user_id }` to `/api/v1/chat/`.
3. `chat_endpoint()` in `backend/app/api/chat.py` first calls `is_retrieval_index_ready()`.
4. If `parents.jsonl`, `children.jsonl`, or `storage/chroma` is missing, the route returns a fallback:
   - major question: structured `Major` table answer
   - non-major question: knowledge-not-ready message
5. If the index is ready, `answer_question()` runs:
   - optionally rewrites follow-up questions using memory and Gemini
   - retrieves relevant parent documents
   - formats context and sources
   - loads memory summary and recent messages
   - builds final context-only prompt
   - invokes Gemini
   - appends user/assistant messages to file memory
   - optionally summarizes old memory
6. The backend saves the final answer to SQL `ChatHistory`.
7. The response shape is `{ reply, status, sources }`.
8. `ChatPage.jsx` renders the bot answer, source cards, copy button, regenerate button, and collapse control.

## Retrieval Subgraph

`retrieve_docs(question, k)` in `rag_app/rag/retriever.py`:

1. `plan_queries()` detects admission/curriculum/general intent from keyword lists.
2. Each plan can add intent-specific query text and a metadata filter:
   - admission: `{"doc_type": "admission"}`
   - curriculum: `{"doc_type": "curriculum"}`
3. `build_retriever()` creates a `MultiVectorRetriever` over:
   - Chroma child-vector store
   - in-memory parent docstore loaded from `parents.jsonl`
   - `id_key="doc_id"` to map child hits back to parents
4. Chroma semantic retrieval embeds the query through `HuggingFaceEmbeddings`.
5. BM25 retrieval searches tokenized child chunks and returns parent ids.
6. `_fuse_docs_by_rrf()` fuses Chroma and BM25 results.
7. For total-credit questions, an extra focused curriculum retrieval pass is added.
8. For mixed admission + curriculum questions, an unfiltered broad retrieval pass is added.
9. All candidate groups are fused again.
10. Optional `rerank()` runs if `RERANKER_ENABLED=true`.
11. `boost_total_credit_docs()` and `ensure_plan_doc_type_coverage()` post-process results.
12. `format_context()` builds `[DOCUMENT n]` blocks with selected metadata and content.
13. `format_sources()` returns frontend-visible source metadata and previews.

## Knowledge Ingestion Subgraph

`upload_document()` in `backend/app/api/knowledge.py`:

1. Requires admin via `require_admin`.
2. Allows `.pdf`, `.html`, `.htm`, `.txt`, `.md`.
3. Generates a timestamp/UUID-safe filename.
4. Saves:
   - PDFs to `data/raw/pdf`
   - HTML/HTM to `data/raw/html`
   - TXT/MD original text to `data/raw/text`, plus converted HTML to `data/raw/html`
5. Creates `KnowledgeDocument` with `source_type="upload"` and `status="processing"`.
6. Schedules `run_knowledge_ingest(document.id)` as a FastAPI background task.

`run_knowledge_ingest()`:

1. Opens a DB session and marks the document `processing`.
2. Acquires `knowledge_ingest_lock`, so ingestion/rebuilds are serialized.
3. Ensures raw data directories exist.
4. Resets retrieval caches.
5. Calls `run_prepare_multivector()`:
   - processes all configured raw PDFs/HTMLs, not only the uploaded file
   - creates parent records
   - creates child records for text chunks, table summaries/row groups, and image metadata/OCR
   - writes `parents.jsonl` and `children.jsonl`
6. Calls `scripts.ingest_multivector.ingest()`:
   - optionally deletes/reset Chroma collection when `RESET_INDEX=true`
   - loads parents and children from JSONL
   - embeds child documents with `HuggingFaceEmbeddings`
   - adds children to Chroma, batching if needed
7. Rebuilds BM25 from `children.jsonl`.
8. Resets retriever caches again.
9. Marks document `indexed`, or `failed` with `error_message` on exception.

## Storage Graph

| Storage | Producer | Consumer |
| --- | --- | --- |
| `backend/uit_chatbot.db` | backend models/routes | auth, admin, history, major fallback, knowledge status |
| `data/raw/pdf` | knowledge upload, manual seed files | indexing pipeline PDF processor |
| `data/raw/html` | knowledge upload, TXT/MD conversion, manual seed files | indexing pipeline HTML processor |
| `data/raw/text` | TXT/MD upload originals | delete cleanup/reference only |
| `data/processed/multivector_preview/parents.jsonl` | `run_prepare_multivector()` | retriever parent docstore, vector ingestion loader |
| `data/processed/multivector_preview/children.jsonl` | chunkers in indexing pipeline | Chroma ingestion, BM25 rebuild |
| `storage/chroma` | `scripts/ingest_multivector.py` | Chroma vector search in retriever |
| `storage/bm25_index.pkl` | `rebuild_bm25_indexer()` | BM25 keyword retrieval |
| `storage/memory/*.json` | RAG chain memory store | question rewrite, final prompt memory, summarization |
| `data/processed/downloaded_images` | HTML helpers/image extraction | OCR/image child chunking |

## Config Graph

`rag_app/core/config.py` loads `.env` from repository root.

Key variables:

- LLM: `GOOGLE_API_KEY`, `GEMINI_MODEL`, `LLM_TEMPERATURE`
- Embedding: `EMBEDDING_MODEL_NAME`, `EMBEDDING_DEVICE`, `NORMALIZE_EMBEDDINGS`
- Data paths: `PDF_DIR`, `HTML_DIR`, `PROCESSED_DIR`, `DOWNLOADED_IMAGES_DIR`, `CHROMA_DIR`
- Chroma: `CHROMA_COLLECTION_NAME`, `CHROMA_DISTANCE_METRIC`, `RESET_INDEX`, `CHROMA_BATCH_SIZE`
- Ingestion toggles: `PROCESS_PDF`, `PROCESS_HTML`
- Chunking: `CHUNK_SIZE`, `CHUNK_OVERLAP`, `CHUNK_MAX_TOKENS`
- Retrieval: `RETRIEVAL_TOP_K`, `DEBUG_TOP_K`
- Reranking: `RERANKER_ENABLED`, `RERANKER_MODEL`, `RERANKER_TOP_K`
- Memory: `MEMORY_DIR`, `MEMORY_MAX_RECENT_TURNS`, `MEMORY_SUMMARY_TRIGGER_TURNS`, `QUESTION_REWRITE_ENABLED`
- Startup warm-up: `RAG_WARMUP_ENABLED`
- Frontend API base: `VITE_API_URL` in Vite env, defaulting to `http://localhost:8000`

## Important Observations

- The knowledge upload flow is not incremental per document; it rebuilds the full processed JSONL and Chroma/BM25 index from all raw files.
- Child chunks are embedded and stored in Chroma; parent documents are returned to the LLM through `MultiVectorRetriever` using `doc_id`.
- Retrieval is hybrid semantic + keyword, not vector-only.
- SQL `ChatHistory` and file-backed RAG memory are separate stores.
- `KnowledgeDocument.status` is a management/status signal; retrieval readiness is checked by the existence of processed JSONL files and Chroma directory.
- TXT/MD uploads are converted to HTML before indexing, so they enter the HTML/curriculum branch unless metadata logic is changed.
