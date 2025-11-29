#!/bin/bash

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Zatrzymywanie ExpenseHelper...${NC}"

# Zatrzymaj backend (uvicorn)
BACKEND_PID=$(pgrep -f "uvicorn app.main:app")
if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID
    echo -e "${GREEN}✓ Backend zatrzymany (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}Backend nie jest uruchomiony${NC}"
fi

# Zatrzymaj frontend (vite)
FRONTEND_PID=$(pgrep -f "vite")
if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID
    echo -e "${GREEN}✓ Frontend zatrzymany (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}Frontend nie jest uruchomiony${NC}"
fi

echo -e "${GREEN}✅ Gotowe!${NC}"
