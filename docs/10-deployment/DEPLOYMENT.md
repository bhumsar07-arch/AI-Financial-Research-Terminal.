# Deployment & Local Operations Guide (Non-Docker)

## 1. Operating Environment & Principles

In accordance with project constraints, **Docker is strictly excluded**. All services run natively on host environments using standard language package managers (`npm`, `pip`, `venv`) and native services.

---

## 2. Local Development Setup (Windows / macOS / Linux)

### 2.1 Prerequisites
1. **Node.js**: Version 18.x or 20.x LTS installed (`node -v`, `npm -v`).
2. **Python**: Version 3.10 or 3.11 installed (`python --version`).
3. **PostgreSQL**: Version 15 or 16 installed locally with the **pgvector** extension.
   * On Windows: Install PostgreSQL via standard EDB installer. Install `pgvector` pre-built binary for Windows or compile using Visual Studio C++ build tools.

### 2.2 Database Initialization
1. Open PostgreSQL CLI (`psql`) or pgAdmin:
   ```sql
   CREATE DATABASE financial_terminal;
   \c financial_terminal;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. Verify vector extension:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
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
   OPENAI_API_KEY=your_openai_api_key_here
   EMBEDDING_MODEL=text-embedding-3-small
   PORT=8000
   ```
3. Start FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *FastAPI server runs on `http://localhost:8000` (docs at `http://localhost:8000/docs`).*

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
| **PostgreSQL + pgvector** | **Supabase** or **Neon** | Fully-managed serverless PostgreSQL with native one-click `pgvector` support. |
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
