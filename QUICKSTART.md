# ExpenseHelper - Quick Start 🚀

## Opcja 1: Automatyczny Start (Zalecane)

### Krok 1: Konfiguracja bazy danych
```bash
./setup-db.sh
```
Wybierz:
- **SQLite** (opcja 2) - szybki start, bez dodatkowej instalacji
- **PostgreSQL** (opcja 1) - jeśli masz PostgreSQL zainstalowany

### Krok 2: Uruchom aplikację
```bash
./start.sh
```

Aplikacja uruchomi się automatycznie:
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

**Zatrzymanie:** Naciśnij `Ctrl+C`

---

## Opcja 2: Manualne Uruchomienie

### Backend
```bash
# Utwórz i aktywuj virtual environment
python3 -m venv venv
source venv/bin/activate

# Zainstaluj zależności
pip install -r requirements.txt

# Uruchom backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (nowy terminal)
```bash
cd frontend
npm install
npm run dev
```

---

## Wymagania

- **Python 3.8+**
- **Node.js 18+**
- **PostgreSQL** (opcjonalnie - możesz użyć SQLite)

### Instalacja PostgreSQL (WSL/Ubuntu)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start

# Ustaw hasło dla użytkownika postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Utwórz bazę danych
sudo -u postgres createdb expenses
```

---

## Testowanie

Po uruchomieniu aplikacji:

1. Otwórz przeglądarkę: http://localhost:5173
2. Kliknij "Zarejestruj się"
3. Wypełnij formularz rejestracji
4. Po rejestracji zostaniesz automatycznie zalogowany
5. Sprawdź console.log w przeglądarce - powinien być token

---

## Debugowanie

### Backend nie startuje?
```bash
# Sprawdź logi
cat backend.log

# Sprawdź czy port 8000 jest wolny
lsof -i :8000

# Sprawdź bazę danych
source venv/bin/activate
python -c "from app.database import engine; print(engine.url)"
```

### Frontend nie startuje?
```bash
# Sprawdź logi
cat frontend.log

# Sprawdź czy port 5173 jest wolny
lsof -i :5173

# Reinstaluj zależności
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors?
Backend już ma CORS skonfigurowany. Upewnij się, że:
- Backend działa na http://localhost:8000
- Frontend działa na http://localhost:5173

---

## Kolejne kroki

Po pomyślnym uruchomieniu możesz:
- Sprawdzić API dokumentację: http://localhost:8000/docs
- Testować endpointy z poziomu Swagger UI
- Rozwijać kolejne komponenty frontendu
