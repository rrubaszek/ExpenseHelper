from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# SQLite Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./expenses.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    future=True
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
