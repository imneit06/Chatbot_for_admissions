import pickle
import os
from pathlib import Path
from typing import Optional

from rank_bm25 import BM25Okapi
import underthesea

from rag_app.core.config import CHILDREN_PATH, ROOT_DIR
from rag_app.utils import read_jsonl

BM25_INDEX_PATH = ROOT_DIR / "storage" / "bm25_index.pkl"


class BM25Indexer:
    def __init__(self, index_path: str | Path = BM25_INDEX_PATH, auto_load: bool = True):
        self.index_path = index_path
        self.index: Optional[BM25Okapi] = None
        self.corpus: list[list[str]] = []
        self.chunk_ids: list[str] = []
        self.parent_ids: list[str] = []
        self.doc_types: list[str] = []
        if auto_load:
            self._load_or_build()

    def _tokenize(self, text: str) -> list[str]:
        return underthesea.word_tokenize(text.lower())

    def _load_or_build(self):
        if os.path.exists(self.index_path):
            self._load()
        else:
            self.build()

    def _load(self):
        with open(self.index_path, "rb") as f:
            data = pickle.load(f)
        self.index = data["index"]
        self.corpus = data["corpus"]
        self.chunk_ids = data["chunk_ids"]
        self.parent_ids = data.get("parent_ids", [])
        self.doc_types = data.get("doc_types", [])

    def build(self, children_file: str = None):
        if children_file is None:
            children_file = CHILDREN_PATH

        chunks = read_jsonl(children_file)
        self.corpus = [self._tokenize(chunk["page_content"]) for chunk in chunks]
        self.chunk_ids = [chunk["metadata"]["doc_id"] for chunk in chunks]
        self.parent_ids = [chunk["metadata"]["doc_id"] for chunk in chunks]
        self.doc_types = [chunk["metadata"].get("doc_type") for chunk in chunks]
        self.index = BM25Okapi(self.corpus) if self.corpus else None
        self.save()

    def save(self):
        Path(self.index_path).parent.mkdir(parents=True, exist_ok=True)
        with open(self.index_path, "wb") as f:
            pickle.dump({
                "index": self.index,
                "corpus": self.corpus,
                "chunk_ids": self.chunk_ids,
                "parent_ids": self.parent_ids,
                "doc_types": self.doc_types,
            }, f)

    def search(self, query: str, top_k: int = 20, doc_type: str = None) -> list[tuple[str, float]]:
        if self.index is None:
            return []

        tokenized_query = self._tokenize(query)
        raw_scores = self.index.get_scores(tokenized_query)

        # Group by parent_id, keep max score
        parent_best: dict[str, float] = {}
        for parent_id, score, dt in zip(self.parent_ids, raw_scores, self.doc_types):
            if not parent_id:
                continue
            if doc_type is not None and dt != doc_type:
                continue
            if parent_id not in parent_best or score > parent_best[parent_id]:
                parent_best[parent_id] = score

        # Sort by score descending, return top_k
        scored = sorted(parent_best.items(), key=lambda x: x[1], reverse=True)
        return scored[:top_k]


# Global singleton
_bm25_indexer: Optional[BM25Indexer] = None


def get_bm25_indexer() -> BM25Indexer:
    global _bm25_indexer
    if _bm25_indexer is None:
        _bm25_indexer = BM25Indexer()
    return _bm25_indexer


def reset_bm25_indexer():
    global _bm25_indexer
    _bm25_indexer = None


def rebuild_bm25_indexer(children_file: str = None) -> BM25Indexer:
    global _bm25_indexer
    _bm25_indexer = BM25Indexer(auto_load=False)
    _bm25_indexer.build(children_file)
    return _bm25_indexer
