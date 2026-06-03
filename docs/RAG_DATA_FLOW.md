# RAG Data Flow

## Flow A: User Sends A Chat Message

### 1. Frontend sends the message

`frontend/src/pages/ChatPage.jsx`

- `sendMessage(rawMessage)` trims the user input.
- It appends a local user message to `messages`.
- It posts to `/api/v1/chat/` through `frontend/src/lib/api.js`.
- Payload:

```json
{
  "message": "user question",
  "user_id": "current user id as string"
}
```

`frontend/src/lib/api.js`

- Uses `VITE_API_URL` if present.
- Defaults to `http://localhost:8000`.
- Adds `Authorization: Bearer <uit_token>` from local storage.

### 2. Backend receives the message

`backend/app/api/chat.py`

- `chat_endpoint(request, db)` receives `ChatRequest`.
- It calls `is_retrieval_index_ready()`.
- Readiness means all of these exist:
  - `PARENTS_PATH`
  - `CHILDREN_PATH`
  - `CHROMA_DIR`

Fallback behavior:

- If index is not ready and the question looks like a major/program question, it answers from SQL `Major`.
- If index is not ready and the question is not a major question, it returns a knowledge-not-ready message.
- If RAG throws a Gemini quota-like error, it returns a quota-specific message.
- Other errors fall back the same way as a not-ready index.

### 3. RAG chain starts

`rag_app/rag/chain.py:answer_question()`

Main steps:

1. Rewrite question if needed.
2. Retrieve documents.
3. Format context.
4. Load file-backed memory.
5. Build prompt.
6. Invoke Gemini.
7. Save memory.
8. Maybe summarize older memory.
9. Return answer and sources.

### 4. Follow-up question rewrite

`rewrite_question(question, session_id)`:

- Loads the session from `storage/memory/<session_id>.json`.
- Checks `QUESTION_REWRITE_ENABLED`.
- Uses heuristic follow-up markers such as "nganh do", "cai do", "vay con", "no".
- Skips rewrite for clear keyword-rich questions.
- If rewrite is needed, builds `REWRITE_PROMPT_TEMPLATE` with:
  - memory summary
  - recent chat history
  - latest question
- Calls Gemini.
- Uses the first returned line as `standalone_question`.

The original user question is still used for the final answer prompt; the standalone question is used for retrieval.

### 5. Query is embedded and relevant documents are retrieved

`rag_app/rag/retriever.py:retrieve_docs(standalone_question, k)`

Retrieval planning:

- `plan_queries()` checks intent keywords.
- Admission questions get `doc_type="admission"` and an expanded query.
- Curriculum questions get `doc_type="curriculum"` and an expanded query.
- Mixed questions get more than one plan.
- General questions use no metadata filter.

For each plan:

1. `build_retriever(metadata_filter, k)` builds a LangChain `MultiVectorRetriever`.
2. The retriever uses:
   - Chroma vector store at `CHROMA_DIR`
   - parent docstore loaded from `parents.jsonl`
   - `id_key="doc_id"`
3. Chroma semantic search runs against embedded child chunks.
4. BM25 keyword search runs against child chunks.
5. Parent docs from Chroma and BM25 are fused with reciprocal rank fusion.

Important detail:

- The query embedding is performed inside Chroma/LangChain through the vector store embedding function.
- The embedding function is `HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)`.
- Default embedding model: `BAAI/bge-m3`.

Hybrid retrieval sources:

- Vector side: `storage/chroma`
- Keyword side: `storage/bm25_index.pkl`
- Parent source: `data/processed/multivector_preview/parents.jsonl`

Post-processing:

- Total-credit questions get an extra focused curriculum retrieval.
- Mixed admission/curriculum questions get a broad unfiltered retrieval.
- All candidate groups are RRF-fused again.
- If `RERANKER_ENABLED=true`, `rag_app/rag/reranker.py:rerank()` reranks candidates.
- Total-credit docs can be boosted.
- Mixed questions ensure at least one required doc type appears when available.

### 6. Prompt/context is built

`format_context(docs)` builds `[DOCUMENT n]` blocks.

Each block includes selected metadata:

- source title
- document type
- source year
- page
- major
- section
- content

`format_sources(docs)` creates frontend source metadata:

- document number
- source path/title/type
- doc type
- year
- page/location
- parent type
- major name
- section/table/image ids
- preview

`answer_question()` then builds:

```text
SYSTEM_PROMPT

RAG_PROMPT_TEMPLATE(
  memory_summary,
  recent_chat_history,
  context,
  question,
  standalone_question
)
```

`SYSTEM_PROMPT` requires:

- answer only from context
- no outside knowledge
- no fabrication
- Vietnamese answer
- preserve exact numbers
- cite used documents as `Nguon: [DOCUMENT 1]`

### 7. LLM generates answer

`build_llm()` creates a cached `ChatGoogleGenerativeAI` client:

- model: `GEMINI_MODEL`, default `gemini-2.5-flash`
- temperature: `LLM_TEMPERATURE`, default `0.2`

`llm.invoke(prompt)` returns the answer text.

### 8. Answer returns to frontend

After generation:

- `FileChatMemoryStore.append_message()` saves the user message.
- `FileChatMemoryStore.append_message()` saves the assistant answer.
- `maybe_summarize_memory()` summarizes older messages when the trigger is exceeded.
- `chat_endpoint()` saves a SQL `ChatHistory` row.
- Response:

```json
{
  "reply": "answer text",
  "status": "Da tra loi",
  "sources": []
}
```

`ChatPage.jsx` then appends a bot message and renders:

- answer text
- source cards
- collapse/expand for long answers
- copy button
- regenerate button

## Flow B: Admin Adds New Knowledge

### 1. Admin uploads a file

`frontend/src/pages/AdminPage.jsx:KnowledgeTab`

- Admin selects a file.
- Allowed frontend extensions: `pdf`, `html`, `htm`, `txt`, `md`.
- `handleUpload()` creates `FormData` with `file`.
- It posts to `/api/v1/knowledge/upload`.
- The tab then refreshes document/status data.
- If any document is `uploaded` or `processing`, it polls every 4 seconds.

### 2. Backend saves file/text

`backend/app/api/knowledge.py:upload_document()`

- Requires admin via `require_admin`.
- Ensures knowledge directories exist:
  - `data/raw/pdf`
  - `data/raw/html`
  - `data/raw/text`
- Validates extension.
- Creates a safe filename with timestamp and UUID.

Save rules:

- `.pdf` -> `data/raw/pdf/<safe>.pdf`
- `.html` or `.htm` -> `data/raw/html/<safe>.html`
- `.txt` or `.md`:
  - raw original -> `data/raw/text/<safe>.<txt|md>`
  - HTML wrapper -> `data/raw/html/<safe>.html`

TXT/MD conversion:

- `text_to_html()` escapes title/body.
- Body is wrapped in a `<pre>` element.

The route creates a `KnowledgeDocument` row:

- `filename`
- `original_filename`
- `file_path`
- `file_type`
- `source_type="upload"`
- `status="processing"`
- `uploaded_by=current_admin.id`

Then:

- commits the DB row
- schedules `run_knowledge_ingest(document.id)` as a FastAPI background task
- returns the document response immediately

### 3. Ingestion worker runs

`backend/app/services/knowledge_ingest_service.py:run_knowledge_ingest(document_id)`

- Opens a fresh SQLAlchemy session.
- Gets the `KnowledgeDocument`.
- Marks it `processing`.
- Acquires `knowledge_ingest_lock`.
- Resets retrieval caches.
- Calls `run_prepare_multivector()`.
- Calls `scripts.ingest_multivector.ingest()`.
- Rebuilds BM25.
- Resets retrieval caches again.
- Marks the document `indexed` or `failed`.

This is effectively a serialized full-index rebuild.

### 4. Text is chunked

`rag_app/indexing/pipeline.py:run_prepare_multivector()`

- Creates a `RecursiveCharacterTextSplitter`.
- Defaults:
  - `CHUNK_SIZE=1200`
  - `CHUNK_OVERLAP=120`
- Processes PDFs when `PROCESS_PDF=true`.
- Processes HTML when `PROCESS_HTML=true`.
- Writes:
  - `parents.jsonl`
  - `children.jsonl`

PDF path:

- `process_pdfs()` reads every `*.pdf` under `PDF_DIR`.
- `extract_pdf_text_tables_images()` returns page text and tables.
- Each PDF page becomes one parent document.
- PDF metadata includes:
  - `doc_type="admission"`
  - `page`
  - `source_year`
  - `file_type="pdf"`
- Tables create child records and table text is included in the parent.
- Text chunks are added with `add_text_chunks()`.

HTML path:

- `process_htmls()` reads every `*.html` and `*.htm` under `HTML_DIR`.
- `extract_html_text_tables_images()` returns text, tables, and images.
- Text is split into sections.
- Each section becomes one parent document.
- Each table can become a separate parent document.
- Each relevant OCR/image block can become a separate parent document.
- HTML metadata includes:
  - `doc_type="curriculum"`
  - `major_name`
  - `section_title` or table/image index
  - `source_year`
  - `file_type="html"`

Child chunk types:

- `text_chunk`
- `table_summary`
- `table_row_group`
- `image_summary`
- `image_ocr_text`

Text chunk quality:

- `<300 chars`: `short_fragment`
- `300-1000 chars`: `good`
- `>1000 chars`: `long_chunk`

Retriever filters out `chunk_quality="short_fragment"` for vector retrieval.

### 5. Embeddings are created

`scripts/ingest_multivector.py:ingest()`

- Creates `CHROMA_DIR`.
- If `RESET_INDEX=true`, deletes the existing Chroma collection.
- Loads parent records from `parents.jsonl`.
- Loads child records from `children.jsonl`.
- Builds `HuggingFaceEmbeddings`.
- Default model: `BAAI/bge-m3`.
- Device is resolved through `resolve_torch_device()`, with CPU fallback when CUDA is unavailable.
- `NORMALIZE_EMBEDDINGS=true` by default.

### 6. Chunks are inserted into vector database

`build_vectorstore()` creates a Chroma vector store:

- collection: `CHROMA_COLLECTION_NAME`
- persist dir: `CHROMA_DIR`
- distance metric: `CHROMA_DISTANCE_METRIC`, default `cosine`

`add_documents_with_fallback()`:

- tries `vectorstore.add_documents(children)`
- if Chroma rejects the batch size, splits into `CHROMA_BATCH_SIZE` batches

Only child documents are stored in Chroma.

Parent documents are stored as JSONL and loaded into an in-memory docstore during retrieval.

### 7. BM25 index is rebuilt

`rebuild_bm25_index()` calls `rebuild_bm25_indexer()`.

`BM25Indexer.build()`:

- reads `children.jsonl`
- tokenizes `page_content` using `underthesea.word_tokenize`
- stores:
  - BM25 index
  - tokenized corpus
  - chunk ids
  - parent ids
  - doc types
- saves to `storage/bm25_index.pkl`

### 8. New knowledge becomes available

After Chroma and BM25 rebuild:

- `refresh_retrieval_after_rebuild()` rebuilds BM25 and clears retriever caches.
- `KnowledgeDocument.status` becomes `indexed`.
- `ChatPage` questions can now retrieve from the rebuilt Chroma and BM25 indexes.

## Delete/Reindex Flows

Reindex:

- `POST /api/v1/knowledge/documents/{document_id}/reindex`
- Validates document exists and is not deleted/processing.
- Marks status `processing`.
- Schedules `run_knowledge_ingest(document.id)`.
- Full rebuild runs from all raw files.

Delete:

- `DELETE /api/v1/knowledge/documents/{document_id}`
- Deletes physical file(s) if under allowed raw roots.
- Marks document `deleted`.
- Schedules `run_knowledge_rebuild_after_delete(document.id)`.
- Full rebuild runs from remaining raw files.

## Key Runtime Boundaries

- Management status is SQL-backed.
- Retrieval readiness is filesystem-backed.
- Answer memory is file-backed.
- Vector retrieval is Chroma-backed.
- Keyword retrieval is pickle/BM25-backed.
- LLM generation is Gemini-backed.
