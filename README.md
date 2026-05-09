# MyNetwork — People Network Manager

A visual web app to map your professional and personal network, find connections by skill, and discover paths to reach anyone through your network.

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker Desktop

### 1. Start the Database
```bash
cd docker
docker-compose up -d
```
Neo4j will be available at: http://localhost:7474  
Login: `neo4j` / `mynetwork123`

### 2. Start the Backend
```bash
cd backend
cp .env.example .env          # Edit .env if needed
pip install -r requirements.txt
uvicorn main:app --reload
```
API will be available at: http://localhost:8000  
API Docs: http://localhost:8000/docs

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
App will be available at: http://localhost:5173

---

## Project Structure
See `ARCHITECTURE.md` for full details.

## Development Plan
See `DEVELOPMENT_PHASES.md` for phase-by-phase build plan.

## API Reference
See `API_SPEC.md` for all endpoints.

## Claude Code Instructions
See `CLAUDE.md` — always give this to Claude Code at the start of every session.
