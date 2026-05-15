from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT_DIR))

from rag_app.indexing.pipeline import run_prepare_multivector  # pyright: ignore[reportMissingImports]

if __name__ == "__main__":
    run_prepare_multivector()
