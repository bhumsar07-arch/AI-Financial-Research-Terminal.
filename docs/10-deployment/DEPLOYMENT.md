# Deployment & Local Operations Guide

## 1. Operating Environment & Principles

The app services run with `npm` and `venv`. Qdrant can run locally with Docker Compose or as a managed Qdrant Cloud cluster.

---

## 2. Local Development Setup (Windows / macOS / Linux)

### 2.1 Prerequisites
1. **Node.js**: Version 18.x or 20.x LTS installed (`node -v`, `npm -v`).
2. **Python**: Version 3.10 or 3.11 installed (`python --version`).
3. **PostgreSQL**: Version 15 or newer for relational application data. No vector extension is required.
4. **Qdrant**: Run the local service with `docker compose up -d qdrant` from the repository root, or configure Qdrant Cloud.

### 2.2 Database Initialization
1. Open PostgreSQL CLI (`psql`) or pgAdmin:
   ```sql
   CREATE DATABASE financial_terminal;
   \c financial_terminal;
   ```

### 2.3 Starting Express Backend
1. Navigate to `backend/`:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgres://postgres:password@localhost:5432/financial_terminal
   JWT_SECRET=super_secret_jwt_key_financial_terminal_2026
   RAG_SERVICE_URL=http://localhost:8000
   ```
3. Run migrations and start server:
   ```bash
   npm run db:push
   npm run dev
   ```
   *Express server runs on `http://localhost:5000`.*

### 2.4 Starting Python RAG Service
1. Navigate to `rag-service/`:
   ```bash
   cd rag-service
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Configure `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/financial_terminal
   QDRANT_URL=http://localhost:6333
   QDRANT_COLLECTION=financial_documents
   GEMINI_API_KEY=your_gemini_api_key
   LLM_MODEL=gemini-2.5-flash
   PORT=8000
   ```
3. Start FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *FastAPI server runs on `http://localhost:8000` (docs at `http://localhost:8000/docs`).*

Run the Ragas benchmark with `python -m app.evaluation.runner` from `rag-service`. It writes measured evaluation and latency results under `rag-service/reports/`.

### 2.5 Starting React Frontend
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Configure `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   *Frontend terminal runs on `http://localhost:5173`.*

---

## 3. Production Deployment Strategy (No Docker)

For production staging without containerization:

| Component | Target Platform | Deployment Mechanism |
| :--- | :--- | :--- |
| **PostgreSQL** | **Supabase** or **Neon** | Managed relational application data. |
| **Qdrant** | **Qdrant Cloud** | Managed vector search and payload filtering; configure `QDRANT_URL` and `QDRANT_API_KEY`. |
| **Express Backend** | **Render** or **Railway** | Native Node.js web service running `npm start` linked to Git repository. |
| **Python RAG Service** | **Render** or **Railway** | Native Python web service running `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. |
| **React Frontend** | **Vercel** or **Cloudflare Pages** | Static SPA deployment with instant CDN global delivery. |

---

## 4. Port Allocation Matrix

| Service | Port | Health Endpoint |
| :--- | :--- | :--- |
| **React Frontend** | `5173` | `http://localhost:5173` |
| **Express Backend** | `5000` | `http://localhost:5000/api/health` |
| **Python RAG Service** | `8000` | `http://localhost:8000/health` |
| **PostgreSQL Database** | `5432` | Native TCP Connection |
| **Qdrant** | `6333` | HTTP API for vectors and metadata |
