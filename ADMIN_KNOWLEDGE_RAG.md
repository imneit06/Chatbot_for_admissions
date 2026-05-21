# Admin Knowledge RAG

## Seed UIT Majors

Run from the repository root:

```bash
python scripts/seed_uit_majors.py
```

The seed is idempotent and upserts by `code`. It uses the current `Major` fields only: `code`, `name`, `fee`, `admission_blocks`, and `description`. `fee` is set to `Chưa cập nhật`.

TODO: Add international joint programs later if product scope requires.

## Upload Knowledge Documents

1. Run backend and frontend.
2. Login as admin.
3. Open `/admin`.
4. Go to tab `Tri thức Chatbot`.
5. Upload a PDF, HTML, TXT, or MD file.
6. Wait for status to become `indexed`.

TXT and MD files are converted to simple HTML so the current HTML/PDF RAG pipeline can process them.

## Check RAG

After a document reaches `indexed`:

1. Open `/chat`.
2. Ask a question whose answer exists in the uploaded document.

If chat fails because Gemini or RAG is not configured, check the backend error message and `.env`.

## CPU Note

For CPU-only machines, set this in the root `.env`:

```env
EMBEDDING_DEVICE=cpu
```

Do not install CUDA just for local smoke tests.

## Index Note

This phase rebuilds the full index from raw documents. This is acceptable for the current project size and avoids unsafe partial Chroma deletion.

TODO: Add incremental indexing and granular Chroma delete in a later RAG phase.
