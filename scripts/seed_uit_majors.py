from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"

sys.path.append(str(ROOT_DIR))
sys.path.append(str(BACKEND_DIR))

from app.db.session import Base, SessionLocal, engine
from app.models.major import Major  # noqa: F401
from app.services.major_seed_service import seed_uit_majors


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        result = seed_uit_majors(db)
        print("Seed UIT majors completed.")
        print(f"Inserted: {result['inserted']}")
        print(f"Updated: {result['updated']}")
        print(f"Skipped: {result['skipped']}")
        print(f"Total: {result['total']}")
        print(result["todo"])
    finally:
        db.close()


if __name__ == "__main__":
    main()
