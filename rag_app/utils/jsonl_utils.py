import json
from pathlib import Path
from langchain_core.documents import Document 

def doc_to_json(doc: Document):
    return {
        "page_content": doc.page_content,
        "metadata": doc.metadata,
    }

def write_jsonl(path: Path, records: list[dict]):
    with open(path, "w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")


def read_jsonl(path: Path) -> list[dict]:
    """Đọc file JSONL, mỗi dòng là một JSON object."""
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                data.append(json.loads(line))
    return data