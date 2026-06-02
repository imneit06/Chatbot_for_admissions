import json
import logging
import time

from langchain_core.documents import Document  
from langchain_core.stores import InMemoryStore  
from langchain_chroma import Chroma  
from langchain_huggingface import HuggingFaceEmbeddings  

try:
    from langchain.retrievers.multi_vector import MultiVectorRetriever  
except Exception:
    from langchain_classic.retrievers.multi_vector import MultiVectorRetriever  

from rag_app.core.config import (
    CHILDREN_PATH,
    PARENTS_PATH,
    CHROMA_DIR,
    CHROMA_COLLECTION_NAME,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DEVICE,
    NORMALIZE_EMBEDDINGS,
    RETRIEVAL_TOP_K,
    RERANKER_ENABLED,
)

from rag_app.rag.reranker import rerank
from rag_app.search.bm25_index import get_bm25_indexer, reset_bm25_indexer

logger = logging.getLogger(__name__)

# Module-level singletons
_embeddings = None
_vectorstore = None
_docstore = None


def elapsed_ms(start: float) -> float:
    return (time.perf_counter() - start) * 1000


def log_retrieval_timing(step: str, start: float, **extra):
    extra_text = " ".join(f"{key}={value}" for key, value in extra.items())
    logger.warning(
        "[retriever timing] step=%s ms=%.1f %s",
        step,
        elapsed_ms(start),
        extra_text,
    )


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = build_embeddings()
    return _embeddings


def get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = build_vectorstore()
    return _vectorstore


def get_docstore():
    global _docstore
    if _docstore is None:
        _docstore = load_parent_docstore()
    return _docstore


def reset_retrieval_cache(reset_bm25: bool = True):
    global _vectorstore, _docstore
    _vectorstore = None
    _docstore = None

    if reset_bm25:
        reset_bm25_indexer()


def is_retrieval_index_ready() -> bool:
    return PARENTS_PATH.exists() and CHILDREN_PATH.exists() and CHROMA_DIR.exists()


def warm_up_retrieval() -> bool:
    if not is_retrieval_index_ready():
        logger.info("Skip retrieval warm-up because processed RAG index is not ready.")
        return False

    try:
        get_embeddings()
        get_vectorstore()
        get_docstore()
        get_bm25_indexer()
    except Exception:
        logger.exception("Retrieval warm-up failed.")
        return False

    logger.info("Retrieval warm-up completed.")
    return True


ID_KEY = "doc_id"


def load_parent_docstore():
    parents = []

    with open(PARENTS_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue

            item = json.loads(line)

            doc = Document(
                page_content=item["page_content"],
                metadata=item["metadata"],
            )

            parents.append((item["doc_id"], doc))

    docstore = InMemoryStore()
    docstore.mset(parents)

    return docstore


def build_embeddings():
    device = EMBEDDING_DEVICE
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL_NAME,
        model_kwargs={
            "device": device,
        },
        encode_kwargs={
            "normalize_embeddings": NORMALIZE_EMBEDDINGS,
        },
    )


def build_vectorstore():
    return Chroma(
        collection_name=CHROMA_COLLECTION_NAME,
        embedding_function=get_embeddings(),
        persist_directory=str(CHROMA_DIR),
        collection_metadata={
            "hnsw:space": "cosine",
        },
    )


ADMISSION_TERMS = [
    "tuyển sinh",
    "xét tuyển",
    "tổ hợp",
    "mã ngành",
    "chỉ tiêu",
    "điểm chuẩn",
    "điểm trúng tuyển",
    "học phí",
    "phương thức",
    "học bạ",
    "thpt",
    "đánh giá năng lực",
    "đgnl",
    "ưu tiên xét tuyển",
]


CURRICULUM_TERMS = [
    "chương trình đào tạo",
    "chương trình học",
    "khung chương trình",
    "môn học",
    "học những môn",
    "học môn gì",
    "bao nhiêu tín chỉ",
    "tín chỉ",
    "chuẩn đầu ra",
    "cơ hội việc làm",
    "vị trí việc làm",
    "thực tập",
    "đồ án",
]


def has_any_term(text: str, terms: list[str]) -> bool:
    text = text.lower()
    return any(term in text for term in terms)


def build_intent_query(question: str, doc_type: str | None) -> str:
    q = question.lower()
    extra_notes = []

    if doc_type == "admission":
        if "xét tuyển tổng hợp" in q or "áp dụng cho" in q or "đối tượng" in q:
            extra_notes.append(
                "Ưu tiên mục Phương thức 2: Xét tuyển tổng hợp, đối tượng, điều kiện, "
                "thí sinh tốt nghiệp THPT hoặc tương đương."
            )

        if "mã xét tuyển" in q or "mã ngành" in q:
            extra_notes.append(
                "Ưu tiên bảng tuyển sinh có tên chương trình, mã xét tuyển, mã ngành, "
                "nhóm ngành và chỉ tiêu."
            )

        if "việt nhật" in q or "việt - nhật" in q:
            extra_notes.append(
                "Phân biệt Công nghệ thông tin thường với Công nghệ thông tin Việt Nhật."
            )
        
        if "điểm chuẩn" in q or "điểm trúng tuyển" in q or "điểm xét tuyển" in q:
            extra_notes.append(
                "Điểm chuẩn trong câu hỏi tương ứng với điểm trúng tuyển trong tài liệu. "
                "Ưu tiên bảng có cột Năm tuyển sinh 2024, Năm tuyển sinh 2025, "
                "Phương thức tuyển sinh, Chỉ tiêu, Số nhập học, Điểm trúng tuyển. "
                "Nếu câu hỏi không nêu năm, tìm các năm có trong bảng."
            )
        if "học phí" in q:
            extra_notes.append(
                "Ưu tiên mục 'Học phí dự kiến; lộ trình tăng học phí tối đa cho từng năm', "
                "bảng học phí theo chương trình đào tạo và các năm học 2026-2027, "
                "2027-2028, 2028-2029, 2029-2030. Không ưu tiên bảng mã ngành nếu câu hỏi chỉ hỏi học phí."
            )


        return (
            question
            + "\nTập trung tìm thông tin tuyển sinh: mã ngành, tổ hợp xét tuyển, "
              "phương thức xét tuyển, chỉ tiêu, học phí, điểm chuẩn, mã tổ hợp như A00 A01 D01. "
            + " ".join(extra_notes)
        )

    if doc_type == "curriculum":
        if "tín chỉ" in q and (
            "tối thiểu" in q or "bao nhiêu" in q or "tổng" in q
        ):
            extra_notes.append(
                "Ưu tiên phần số tín chỉ đào tạo, tổng số tín chỉ, điều kiện tốt nghiệp, "
                "công nhận tốt nghiệp, khối lượng chương trình, tổng cộng, tối thiểu, "
                "không chỉ các nhóm môn hoặc học kỳ riêng lẻ."
            )

        if "mã ngành đào tạo" in q or "thông tin chung" in q:
            extra_notes.append(
                "Ưu tiên phần thông tin chung có mã ngành đào tạo, tên ngành đào tạo, "
                "trình độ đào tạo và loại hình đào tạo."
            )

        if "tiếng nhật" in q or "việt nhật" in q or "việt - nhật" in q:
            extra_notes.append(
                "Ưu tiên các bảng hoặc mục có môn Tiếng Nhật, kế hoạch đào tạo tiếng Nhật, "
                "và chương trình Công nghệ thông tin Việt Nhật."
            )

        return (
            question
            + "\nTập trung tìm thông tin chương trình đào tạo: môn học, khung chương trình, "
              "tín chỉ, môn bắt buộc, môn tự chọn, chuẩn đầu ra. "
            + " ".join(extra_notes)
        )

    return question


def plan_queries(question: str):
    """
    Phân tích câu hỏi để quyết định cần retrieve ở loại tài liệu nào.
    Bản đầu tiên này chưa tách câu hỏi thành nhiều câu nhỏ,
    nhưng đã cho phép một câu hỏi lấy cả admission và curriculum.
    """
    q = question.lower()

    has_admission = has_any_term(q, ADMISSION_TERMS)
    has_curriculum = has_any_term(q, CURRICULUM_TERMS)

    plans = []

    if has_admission:
        plans.append({
            "query": build_intent_query(question, "admission"),
            "doc_type": "admission",
            "intent": "admission",
        })

    if has_curriculum:
        plans.append({
            "query": build_intent_query(question, "curriculum"),
            "doc_type": "curriculum",
            "intent": "curriculum",
        })

    if not plans:
        plans.append({
            "query": question,
            "doc_type": None,
            "intent": "general",
        })

    return plans


def metadata_filter_from_plan(plan: dict):
    doc_type = plan.get("doc_type")

    if not doc_type:
        return None

    return {"doc_type": doc_type}


def build_retriever(metadata_filter=None, k=RETRIEVAL_TOP_K):
    vectorstore = get_vectorstore()
    docstore = get_docstore()

    if metadata_filter:
        filter_clause = {
            "$and": [
                metadata_filter,
                {"chunk_quality": {"$nin": ["short_fragment"]}},
            ]
        }
    else:
        filter_clause = {"chunk_quality": {"$nin": ["short_fragment"]}}

    search_kwargs = {
        "k": k,
        "filter": filter_clause,
    }

    return MultiVectorRetriever(
        vectorstore=vectorstore,
        docstore=docstore,
        id_key=ID_KEY,
        search_kwargs=search_kwargs,
    )

# check duplicate document
def _doc_dedup_key(doc):
    meta = doc.metadata or {}

    return (
        meta.get("source"),
        meta.get("location"),
        meta.get("parent_type"),
        meta.get("page"),
        meta.get("section_index"),
        meta.get("table_index"),
        meta.get("image_index"),
        doc.page_content[:200],
    )


def deduplicate_docs(docs):
    seen = set()
    unique_docs = []

    for doc in docs:
        key = _doc_dedup_key(doc)

        if key in seen:
            continue

        seen.add(key)
        unique_docs.append(doc)

    return unique_docs


def merge_doc_groups_round_robin(doc_groups):
    merged_docs = []
    seen = set()

    if not doc_groups:
        return merged_docs

    max_len = max(len(group) for group in doc_groups)

    for idx in range(max_len):
        for group in doc_groups:
            if idx >= len(group):
                continue

            doc = group[idx]
            key = _doc_dedup_key(doc)

            if key in seen:
                continue

            seen.add(key)
            merged_docs.append(doc)

    return merged_docs


def retrieve_with_bm25(question: str, k: int = 20, doc_type: str = None) -> list[str]:
    indexer = get_bm25_indexer()
    results = indexer.search(question, top_k=k, doc_type=doc_type)
    return [doc_id for doc_id, _ in results if doc_id]


def get_docs_by_ids(doc_ids: list[str], docstore=None) -> list:
    if not doc_ids:
        return []

    if docstore is None:
        docstore = get_docstore()

    docs = docstore.mget(doc_ids)
    return [doc for doc in docs if doc]


def reciprocal_rank_fusion(
    ranked_lists: list[list[tuple[str, float]]],
    k: int = 60,
) -> list[tuple[str, float]]:
    rrf_scores: dict[str, float] = {}
    for ranked_list in ranked_lists:
        for rank, (doc_id, _) in enumerate(ranked_list, start=1):
            if not doc_id:
                continue
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)


def _fuse_docs_by_rrf(
    doc_groups: list[list],
    top_k: int,
) -> list:
    rrf_scores: dict[str, tuple[float, object]] = {}
    for group in doc_groups:
        for rank, doc in enumerate(group, start=1):
            key = _doc_dedup_key(doc)
            if not key:
                continue
            if key not in rrf_scores:
                rrf_scores[key] = (0.0, doc)
            old_score, _ = rrf_scores[key]
            rrf_scores[key] = (old_score + 1.0 / (60 + rank), doc)
    sorted_items = sorted(rrf_scores.items(), key=lambda x: x[1][0], reverse=True)
    return [doc for _, (_, doc) in sorted_items[:top_k]]


def is_total_credit_query(question: str) -> bool:
    q = question.lower()

    if "tín chỉ" not in q:
        return False

    has_total_signal = any(
        term in q
        for term in [
            "bao nhiêu",
            "tối thiểu",
            "tổng",
            "toàn khóa",
            "học bao nhiêu",
        ]
    )

    has_program_signal = any(
        term in q
        for term in [
            "ngành",
            "chương trình",
            "học",
        ]
    )

    return has_total_signal and has_program_signal


def build_total_credit_focus_query(question: str) -> str:
    return (
        question
        + "\nTìm đúng thông tin tổng quan về số tín chỉ toàn chương trình: "
          "số tín chỉ đào tạo, tối thiểu bao nhiêu tín chỉ, tổng số tín chỉ học toàn khóa, "
          "điều kiện tốt nghiệp, công nhận tốt nghiệp, sinh viên đã tích lũy tối thiểu tín chỉ."
    )


def credit_relevance_score(doc) -> int:
    text = (doc.page_content or "").lower()

    if "tín chỉ" not in text:
        return 0

    score = 0

    weighted_phrases = [
        ("số tín chỉ đào tạo", 5),
        ("điều kiện tốt nghiệp", 5),
        ("công nhận tốt nghiệp", 5),
        ("tổng số tín chỉ học toàn khóa", 5),
        ("tổng số tín chỉ toàn khóa", 5),
        ("tối thiểu", 3),
        ("toàn khóa", 3),
        ("tích lũy", 2),
        ("khối lượng chương trình", 2),
    ]

    for phrase, weight in weighted_phrases:
        if phrase in text:
            score += weight

    if "tổng cộng 44 tín chỉ" in text or "nhóm các môn học cơ sở ngành" in text:
        score -= 3

    if "học kỳ" in text and "toàn khóa" not in text:
        score -= 2

    return score


def boost_total_credit_docs(docs: list, question: str) -> list:
    if not is_total_credit_query(question):
        return docs

    scored_docs = [
        (idx, credit_relevance_score(doc), doc)
        for idx, doc in enumerate(docs)
    ]

    scored_docs.sort(key=lambda item: (item[1], -item[0]), reverse=True)

    return [doc for _, _, doc in scored_docs]


def build_rerank_query(question: str, plans: list[dict]) -> str:
    intent_queries = [
        plan["query"]
        for plan in plans
        if plan.get("query") and plan.get("query") != question
    ]

    if not intent_queries:
        return question

    return question + "\n" + "\n".join(intent_queries)


def ensure_plan_doc_type_coverage(docs: list, plans: list[dict]) -> list:
    required_doc_types = []
    for plan in plans:
        doc_type = plan.get("doc_type")
        if doc_type and doc_type not in required_doc_types:
            required_doc_types.append(doc_type)

    if len(required_doc_types) < 2:
        return docs

    selected = []
    selected_keys = set()

    for doc_type in required_doc_types:
        for doc in docs:
            if (doc.metadata or {}).get("doc_type") != doc_type:
                continue

            key = _doc_dedup_key(doc)
            if key in selected_keys:
                continue

            selected.append(doc)
            selected_keys.add(key)
            break

    for doc in docs:
        key = _doc_dedup_key(doc)
        if key in selected_keys:
            continue

        selected.append(doc)
        selected_keys.add(key)

    return selected
    

def retrieve_docs(question: str, k: int = RETRIEVAL_TOP_K):
    total_start = time.perf_counter()

    step_start = time.perf_counter()
    plans = plan_queries(question)
    log_retrieval_timing("plan_queries", step_start, plans=len(plans))

    candidate_k = max(k * 2, 10)
    plan_doc_groups = []

    for plan_index, plan in enumerate(plans, start=1):
        plan_filter = metadata_filter_from_plan(plan)

        # Chroma vector search
        plan_doc_type = plan.get("doc_type")

        step_start = time.perf_counter()
        chroma_retriever = build_retriever(metadata_filter=plan_filter, k=candidate_k)
        log_retrieval_timing(
            "build_chroma_retriever",
            step_start,
            plan=plan_index,
            doc_type=plan_doc_type,
        )

        step_start = time.perf_counter()
        chroma_docs = chroma_retriever.invoke(plan["query"])
        log_retrieval_timing(
            "chroma_search",
            step_start,
            plan=plan_index,
            doc_type=plan_doc_type,
            docs=len(chroma_docs),
        )

        # BM25 keyword search (filtered by doc_type)
        step_start = time.perf_counter()
        bm25_raw = retrieve_with_bm25(plan["query"], k=candidate_k, doc_type=plan_doc_type)
        log_retrieval_timing(
            "bm25_search",
            step_start,
            plan=plan_index,
            doc_type=plan_doc_type,
            ids=len(bm25_raw),
        )

        step_start = time.perf_counter()
        bm25_docs = get_docs_by_ids(bm25_raw)
        log_retrieval_timing(
            "docstore_mget",
            step_start,
            plan=plan_index,
            docs=len(bm25_docs),
        )

        # RRF fusion: merge chroma + bm25
        step_start = time.perf_counter()
        fused = _fuse_docs_by_rrf([chroma_docs, bm25_docs], top_k=candidate_k)
        log_retrieval_timing("rrf_fuse_plan", step_start, plan=plan_index, docs=len(fused))
        plan_doc_groups.append(fused)

    if is_total_credit_query(question):
        focused_query = build_total_credit_focus_query(question)
        focused_filter = metadata_filter_from_plan({"doc_type": "curriculum"})

        step_start = time.perf_counter()
        chroma_retriever = build_retriever(
            metadata_filter=focused_filter,
            k=candidate_k,
        )
        log_retrieval_timing("build_focused_chroma_retriever", step_start)

        step_start = time.perf_counter()
        chroma_docs = chroma_retriever.invoke(focused_query)
        log_retrieval_timing("focused_chroma_search", step_start, docs=len(chroma_docs))

        step_start = time.perf_counter()
        bm25_raw = retrieve_with_bm25(
            focused_query,
            k=candidate_k,
            doc_type="curriculum",
        )
        log_retrieval_timing("focused_bm25_search", step_start, ids=len(bm25_raw))

        step_start = time.perf_counter()
        bm25_docs = get_docs_by_ids(bm25_raw)
        log_retrieval_timing("focused_docstore_mget", step_start, docs=len(bm25_docs))

        step_start = time.perf_counter()
        focused_fused = _fuse_docs_by_rrf(
            [chroma_docs, bm25_docs],
            top_k=candidate_k,
        )
        log_retrieval_timing("focused_rrf_fuse", step_start, docs=len(focused_fused))
        plan_doc_groups.append(focused_fused)

    needs_broad_retrieval = len(plans) > 1

    if needs_broad_retrieval:
        broad_query = build_rerank_query(question, plans)

        step_start = time.perf_counter()
        chroma_broad = build_retriever(metadata_filter=None, k=candidate_k).invoke(broad_query)
        log_retrieval_timing("broad_chroma_search", step_start, docs=len(chroma_broad))

        step_start = time.perf_counter()
        bm25_broad_raw = retrieve_with_bm25(broad_query, k=candidate_k)
        log_retrieval_timing("broad_bm25_search", step_start, ids=len(bm25_broad_raw))

        step_start = time.perf_counter()
        bm25_broad_docs = get_docs_by_ids(bm25_broad_raw)
        log_retrieval_timing("broad_docstore_mget", step_start, docs=len(bm25_broad_docs))

        step_start = time.perf_counter()
        broad_fused = _fuse_docs_by_rrf([chroma_broad, bm25_broad_docs], top_k=candidate_k)
        log_retrieval_timing("broad_rrf_fuse", step_start, docs=len(broad_fused))
        plan_doc_groups.append(broad_fused)

    candidate_k = max(k * 2, 10)

    step_start = time.perf_counter()
    candidates = _fuse_docs_by_rrf(plan_doc_groups, top_k=candidate_k)
    log_retrieval_timing("rrf_fuse_all", step_start, docs=len(candidates))

    rerank_query = build_rerank_query(question, plans)

    if RERANKER_ENABLED:
        step_start = time.perf_counter()
        reranked_docs = rerank(rerank_query, candidates, top_k=candidate_k)
        log_retrieval_timing("rerank", step_start, docs=len(reranked_docs))

        step_start = time.perf_counter()
        reranked_docs = boost_total_credit_docs(reranked_docs, question)
        merged_docs = ensure_plan_doc_type_coverage(reranked_docs, plans)[:k]
        log_retrieval_timing("postprocess_docs", step_start, docs=len(merged_docs))
    else:
        step_start = time.perf_counter()
        candidates = boost_total_credit_docs(candidates, question)
        merged_docs = ensure_plan_doc_type_coverage(candidates, plans)[:k]
        log_retrieval_timing("postprocess_docs", step_start, docs=len(merged_docs))

    log_retrieval_timing("total", total_start, docs=len(merged_docs))
    return merged_docs, {"plans": plans}
    

def _clean_meta_value(value):
    if value is None:
        return None
    if value == "":
        return None
    return value


def _format_meta_line(label: str, value):
    value = _clean_meta_value(value)
    if value is None:
        return None
    return f"{label}: {value}"

def trim_text(text, max_chars):
    text = (text or "").strip()

    if len(text) <= max_chars:
        return text

    return text[:max_chars].rstrip() + "\n...[đã rút gọn]"

def format_context(docs):
    blocks = []

    for i, doc in enumerate(docs, start=1):
        meta = doc.metadata or {}

        # Chỉ lấy metadata quan trọng
        meta_lines = [
            _format_meta_line("Tên nguồn", meta.get("source_title")),
            _format_meta_line("Loại tài liệu", meta.get("doc_type")),
            _format_meta_line("Năm nguồn", meta.get("source_year")),
            _format_meta_line("Trang", meta.get("page")),
            _format_meta_line("Ngành", meta.get("major_name")),
            _format_meta_line("Mục", meta.get("section_title")),
        ]


        meta_text = "\n".join(line for line in meta_lines if line)
        # Doc đầu giữ dài hơn
        if i == 1:
            max_chars = 2200
        elif i <= 3:
            max_chars = 1600
        else:
            max_chars = 1000

        content = trim_text(doc.page_content, max_chars)
        
        block = f"""[DOCUMENT {i}]
{meta_text}

Nội dung:
{doc.page_content}
"""
        blocks.append(block)

    return "\n\n".join(blocks)


def format_sources(docs):
    sources = []

    for i, doc in enumerate(docs, start=1):
        meta = doc.metadata or {}

        sources.append({
            "document": i,
            "source": meta.get("source"),
            "source_title": meta.get("source_title"),
            "file_type": meta.get("file_type"),
            "doc_type": meta.get("doc_type"),
            "source_year": meta.get("source_year"),
            "page": meta.get("page"),
            "location": meta.get("location"),
            "parent_type": meta.get("parent_type"),
            "major_name": meta.get("major_name"),
            "section_title": meta.get("section_title"),
            "section_index": meta.get("section_index"),
            "table_index": meta.get("table_index"),
            "image_index": meta.get("image_index"),
            "preview": doc.page_content[:300].replace("\n", " "),
        })

    return sources
