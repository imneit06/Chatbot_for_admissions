# Reading Order

Use this order to understand or modify the RAG chatbot without getting lost.

## 1. Start With The Product Surface

1. `frontend/src/App.jsx`
   - Routes and which pages are protected.
2. `frontend/src/lib/api.js`
   - API base URL, token behavior, auth redirect behavior.
3. `frontend/src/pages/ChatPage.jsx`
   - User message flow, request payload, response rendering, sources, regenerate.
4. `frontend/src/pages/AdminPage.jsx`
   - Knowledge tab upload/status polling/reindex/delete.

## 2. Read Backend Entry And Route Wiring

5. `backend/app/main.py`
   - Router prefixes, startup behavior, admin seed, RAG warm-up.
6. `backend/app/db/session.py`
   - SQLite location and model registration.
7. `backend/app/core/security.py`
   - Auth/admin dependency behavior.

## 3. Follow The Chat Path

8. `backend/app/api/chat.py`
   - `POST /api/v1/chat/`, fallbacks, chat history saving.
9. `rag_app/rag/chain.py`
   - `answer_question()`, rewrite, retrieval, prompt, Gemini, memory.
10. `rag_app/core/prompts.py`
   - Context-only answer contract and rewrite/summary prompts.
11. `rag_app/rag/memory.py`
   - File-backed session memory.

## 4. Follow Retrieval Internals

12. `rag_app/rag/retriever.py`
   - Query planning, Chroma retrieval, BM25 retrieval, RRF fusion, reranker hook, context/source formatting.
13. `rag_app/search/bm25_index.py`
   - Keyword tokenization, index persistence, parent-id grouping.
14. `rag_app/rag/reranker.py`
   - Optional reranking path when enabled.

## 5. Follow Knowledge Upload And Ingestion

15. `backend/app/api/knowledge.py`
   - Upload validation, save destinations, KnowledgeDocument creation, background task scheduling.
16. `backend/app/services/knowledge_ingest_service.py`
   - Serialized full rebuild, cache reset, prepare, Chroma ingest, BM25 rebuild, status updates.
17. `backend/app/models/knowledge_document.py`
   - Document management fields and statuses.

## 6. Read Index Construction

18. `rag_app/indexing/pipeline.py`
   - Parent/child generation from raw PDFs and HTML files.
19. `rag_app/loaders/pdf_loader.py`
   - PDF text/table/image extraction.
20. `rag_app/loaders/html_loader.py`
   - HTML text/table/image extraction.
21. `rag_app/loaders/html_helpers.py`
   - Image relevance, OCR, child content prefixes.
22. `rag_app/chunking/text_chunker.py`
   - Text splitting and chunk quality.
23. `rag_app/chunking/table_chunker.py`
   - Table summary and row-group child docs.
24. `rag_app/chunking/image_chunker.py`
   - Image summary and OCR child docs.
25. `scripts/ingest_multivector.py`
   - Embedding children and inserting them into Chroma.

## 7. Read Configuration Last

26. `rag_app/core/config.py`
   - Environment variable loading, path resolution, embedding device fallback, defaults.
27. `.env.example`
   - Practical runtime knobs.
28. `RUN_LOCAL.md`
   - Local run instructions.
29. `ADMIN_KNOWLEDGE_RAG.md`
   - Existing admin/RAG notes.

## 8. Supporting Backend Areas

30. `backend/app/api/auth.py`
   - User login and user management APIs.
31. `backend/app/api/admin.py`
   - Stats and major seed endpoint.
32. `backend/app/api/major.py`
   - Major CRUD and lookup data.
33. `backend/app/services/major_seed_service.py`
   - Seeded major data.
34. `backend/app/models/*.py`
   - SQL models for users, majors, chat history, and knowledge documents.

## 9. Recommended Flow-Specific Reading

For "user asks a question":

1. `frontend/src/pages/ChatPage.jsx`
2. `backend/app/api/chat.py`
3. `rag_app/rag/chain.py`
4. `rag_app/rag/retriever.py`
5. `rag_app/core/prompts.py`
6. `rag_app/rag/memory.py`

For "admin adds new knowledge":

1. `frontend/src/pages/AdminPage.jsx`
2. `backend/app/api/knowledge.py`
3. `backend/app/services/knowledge_ingest_service.py`
4. `rag_app/indexing/pipeline.py`
5. `rag_app/chunking/*.py`
6. `scripts/ingest_multivector.py`
7. `rag_app/search/bm25_index.py`

For "change retrieval behavior":

1. `rag_app/rag/retriever.py`
2. `rag_app/search/bm25_index.py`
3. `rag_app/rag/reranker.py`
4. `rag_app/core/config.py`

For "change prompt behavior":

1. `rag_app/core/prompts.py`
2. `rag_app/rag/chain.py`
3. `rag_app/rag/memory.py`
