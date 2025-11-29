#!/bin/bash

# Kolory
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   Konfiguracja Bazy Danych${NC}"
echo -e "${BLUE}==================================================${NC}"

echo -e "\nWybierz typ bazy danych:"
echo -e "1) PostgreSQL (wymaga zainstalowanego PostgreSQL)"
echo -e "2) SQLite (szybki start, bez instalacji)"
echo -e ""
read -p "Twój wybór (1/2): " choice

if [ "$choice" = "2" ]; then
    echo -e "${YELLOW}📝 Konfigurowanie SQLite...${NC}"

    # Aktualizuj plik database.py
    cat > app/database.py << 'EOF'
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
EOF

    echo -e "${GREEN}✅ SQLite skonfigurowane${NC}"
    echo -e "${YELLOW}   Baza danych będzie w pliku: expenses.db${NC}"

elif [ "$choice" = "1" ]; then
    echo -e "${YELLOW}📝 Konfigurowanie PostgreSQL...${NC}"

    # Sprawdź czy PostgreSQL działa
    if command -v psql &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL znaleziony${NC}"

        # Spróbuj połączyć się z bazą
        if psql -U postgres -h localhost -l &> /dev/null; then
            echo -e "${GREEN}✓ Połączenie z PostgreSQL OK${NC}"
        else
            echo -e "${YELLOW}⚠ Nie można połączyć się z PostgreSQL${NC}"
            echo -e "${YELLOW}  Uruchom: sudo service postgresql start${NC}"
        fi

        # Utwórz bazę danych
        echo -e "${YELLOW}Tworzenie bazy danych 'expenses'...${NC}"
        psql -U postgres -h localhost -c "CREATE DATABASE expenses;" 2>/dev/null || echo -e "${YELLOW}Baza już istnieje${NC}"

    else
        echo -e "${YELLOW}⚠ PostgreSQL nie jest zainstalowany${NC}"
        echo -e "${YELLOW}  Zainstaluj: sudo apt-get install postgresql${NC}"
    fi

    # Przywróć oryginalną konfigurację
    cat > app/database.py << 'EOF'
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_NAME = os.getenv("POSTGRES_DB", "expenses")
DATABASE_URL = os.getenv("DATABASE_URL", f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}")

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF

    echo -e "${GREEN}✅ PostgreSQL skonfigurowane${NC}"
else
    echo -e "${YELLOW}Nieprawidłowy wybór${NC}"
    exit 1
fi

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}✅ Konfiguracja zakończona!${NC}"
echo -e "${YELLOW}   Możesz teraz uruchomić: ./start.sh${NC}"
echo -e "${BLUE}==================================================${NC}"
