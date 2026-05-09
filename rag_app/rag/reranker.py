from sentence_transformers import CrossEncoder

from rag_app.core.config import RERANKER_MODEL

_cross_encoder = None

def get_reranker():
    global _cross_encoder 
    if _cross_encoder is None:
        _cross_encoder = CrossEncoder(RERANKER_MODEL)
    return _cross_encoder

def rerank(query: str, docs: list, top_k: int = 5) -> list:
    reranker = get_reranker()
    pairs = [(query, doc.page_content) for doc in docs]
    scores = reranker.predict(pairs)
    doc_scores = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, _ in doc_scores[:top_k]]
