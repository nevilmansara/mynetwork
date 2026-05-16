# Running MyNetwork — Complete Guide

Everything you need to start, stop, and verify the stack locally.

---

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Docker Desktop | latest | `docker --version` |
| Python | 3.11+ | `python --version` |
| Node.js | 20+ | `node --version` |
| npm | 9+ | `npm --version` |

> **Port note:** Port 8000 is reserved by Windows on this machine. The backend runs on **8080** instead.

---

## First-Time Setup

Run these once — skip on subsequent runs.

### 1. Backend dependencies

```powershell
cd D:\mynetwork\backend
pip install -r requirements.txt
```

### 2. Backend environment file

```powershell
cd D:\mynetwork\backend
copy .env.example .env
```

The defaults in `.env` work out of the box for local development. Only edit if you change Neo4j credentials.

### 3. Frontend dependencies

```powershell
cd D:\mynetwork\frontend
npm install
```

---

## Starting the Stack

Open **3 separate terminals** and run one section in each.

---

### Terminal 1 — Neo4j Database (Docker)

```powershell
cd D:\mynetwork\docker
docker-compose up -d
```

**Verify it started:**
```powershell
docker ps
```
You should see a `neo4j:5-community` container with status `Up`.

| Interface | URL | Credentials |
|---|---|---|
| Neo4j Browser (optional) | http://localhost:7474 | `neo4j` / `mynetwork123` |
| Bolt connection | bolt://localhost:7687 | (used by backend automatically) |

---

### Terminal 2 — Backend API (FastAPI + Uvicorn)

```powershell
cd D:\mynetwork\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

**Expected startup output:**
```
INFO:database:Neo4j async driver initialized and connectivity verified
INFO:database:Neo4j indexes ensured
INFO:main:MyNetwork API started
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
```

| Interface | URL |
|---|---|
| REST API | http://localhost:8080 |
| Swagger UI (interactive docs) | http://localhost:8080/docs |
| Health check | http://localhost:8080/health |

> If you see `error while attempting to bind on address`: something else is using that port. Try a different port and update `frontend/.env` to match.

---

### Terminal 3 — Frontend (React + Vite)

```powershell
cd D:\mynetwork\frontend
npm run dev
```

**Expected output:**
```
  VITE v8.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## Verifying Everything Works

### Quick health check (run in any terminal)

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

Expected response:
```json
{"api":"ok","database":"ok","timestamp":"..."}
```

### Manual browser test flow

1. Go to **http://localhost:5173** → redirects to `/login`
2. Click **"Create one"** → go to `/register`
3. Fill in name, email, password (min 8 chars), confirm password → **Create account**
4. Should land on `/dashboard` with your name
5. **Refresh the page** → should stay logged in (JWT persists in localStorage)
6. Navigate to http://localhost:5173/login → should redirect back to `/dashboard`
7. Try logging in with the **wrong password** → red error message appears
8. Try registering with the **same email** again → "already exists" error

---

## Stopping the Stack

### Stop frontend and backend
Press `Ctrl+C` in each terminal.

### Stop Neo4j
```powershell
cd D:\mynetwork\docker
docker-compose down
```

To also delete all stored data (full reset):
```powershell
docker-compose down -v
```

---

## Restarting After a Break

Neo4j data persists in a Docker volume — you don't lose data between restarts.

```powershell
# Terminal 1
cd D:\mynetwork\docker && docker-compose up -d

# Terminal 2
cd D:\mynetwork\backend && python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload

# Terminal 3
cd D:\mynetwork\frontend && npm run dev
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Connection refused` on port 8080 | Backend not running | Start Terminal 2 |
| `database: error` on health check | Neo4j not running | Start Terminal 1 |
| Backend starts but crashes immediately | Port 8080 in use | Find PID: `netstat -ano \| findstr :8080`, then `taskkill /PID <pid> /F` |
| `ModuleNotFoundError` on backend start | Deps not installed | Run `pip install -r requirements.txt` |
| Frontend shows blank page | Vite not running | Start Terminal 3 |
| Login redirects back to login | Token invalid/expired | Clear browser localStorage and try again |
| `neo4j.exceptions.ServiceUnavailable` | Docker not running | Start Docker Desktop, then `docker-compose up -d` |

---

## URLs at a Glance

| Service | URL |
|---|---|
| App (frontend) | http://localhost:5173 |
| API | http://localhost:8080 |
| API docs (Swagger) | http://localhost:8080/docs |
| Health check | http://localhost:8080/health |
| Neo4j Browser | http://localhost:7474 |
