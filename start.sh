#!/bin/bash

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   ExpenseHelper - Quick Start${NC}"
echo -e "${BLUE}==================================================${NC}"

# Sprawdź czy Python jest zainstalowany
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 nie jest zainstalowany${NC}"
    exit 1
fi

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js nie jest zainstalowany${NC}"
    exit 1
fi

# Funkcja czyszcząca przy wyjściu
cleanup() {
    echo -e "\n${YELLOW}Zatrzymywanie aplikacji...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Sprawdź czy virtual environment istnieje
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Tworzenie virtual environment...${NC}"
    python3 -m venv venv
fi

# Aktywuj virtual environment i zainstaluj zależności
echo -e "${YELLOW}📦 Instalowanie zależności backendu...${NC}"
source venv/bin/activate
pip install -q -r requirements.txt

# Sprawdź czy frontend/node_modules istnieje
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Instalowanie zależności frontendu...${NC}"
    cd frontend && npm install && cd ..
fi

# Uruchom backend
echo -e "${GREEN}🚀 Uruchamianie backendu na http://localhost:8000${NC}"
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!

# Poczekaj chwilę na start backendu
sleep 2

# Sprawdź czy backend działa
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend nie uruchomił się. Sprawdź backend.log${NC}"
    cat backend.log
    exit 1
fi

echo -e "${GREEN}✓ Backend działa (PID: $BACKEND_PID)${NC}"

# Uruchom frontend
echo -e "${GREEN}🚀 Uruchamianie frontendu...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Poczekaj chwilę na start frontendu
sleep 3

# Sprawdź czy frontend działa
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend nie uruchomił się. Sprawdź frontend.log${NC}"
    cat frontend.log
    kill $BACKEND_PID
    exit 1
fi

echo -e "${GREEN}✓ Frontend działa (PID: $FRONTEND_PID)${NC}"

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}✅ Aplikacja uruchomiona!${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "📊 Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "📊 API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "🌐 Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "${YELLOW}📝 Logi:${NC}"
echo -e "   Backend:  ${BLUE}tail -f backend.log${NC}"
echo -e "   Frontend: ${BLUE}tail -f frontend.log${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "${YELLOW}Aby zatrzymać aplikację, naciśnij Ctrl+C${NC}"

# Wyświetl logi w czasie rzeczywistym
tail -f backend.log frontend.log
