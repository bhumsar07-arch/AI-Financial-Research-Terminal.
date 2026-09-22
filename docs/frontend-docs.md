# Financial Terminal — Frontend Documentation

> Version 2.0.0 · React 19 + Vite 8 · Last updated: September 2026

---

## 1. Overview

The Financial Terminal frontend is a single-page React application providing:
- **Public Landing Page** - premium marketing page for unauthenticated visitors
- **Authenticated Research Dashboard** - company listing with search for logged-in analysts
- **Company Research Page** - deep-dive with financial tables, charts, AI Analyst chat
- **Auth Pages** - Login and Registration with JWT-backed sessions

The frontend communicates with two backend services:
- Express REST API (port 5000) - Auth, companies, financial data, chat proxy
- FastAPI RAG Service (port 8000) - LLM status, document context, PDF serving

---

## 2. Tech Stack

| Dependency | Version | Role |
|---|---|---|
| React | 19.x | UI framework |
| Vite | 8.x | Build tool and dev server |
| React Router DOM | 7.x | Client-side routing |
| Axios | 1.x | HTTP client with JWT interceptors |
| Tailwind CSS | 3.x | Utility-first styling |
| Recharts | 3.x | Financial data visualisations |
| Lucide React | 1.47 | Icon library |

---

## 3. Project Structure

```
frontend/src/
├── App.jsx                         # Root router with protected routes
├── main.jsx                        # ReactDOM entry point
├── index.css                       # Global styles + fonts
├── context/
│   └── AuthContext.jsx             # JWT auth state management
├── services/
│   └── api.js                      # Axios instance with Bearer token interceptor
├── components/
│   ├── layout/
│   │   ├── Header.jsx              # Sticky nav with auth-aware search + user dropdown
│   │   ├── Footer.jsx              # Enterprise footer with copyright + contact
│   │   └── ProtectedRoute.jsx      # Auth guard - redirects to /login if unauthenticated
│   ├── company/
│   │   ├── SearchBar.jsx           # Debounced company search with keyboard nav
│   │   ├── FinancialTable.jsx      # Multi-year financial statements table
│   │   └── FinancialCharts.jsx     # Revenue/margin/ratio charts via Recharts
│   └── chat/
│       └── AiAnalystPanel.jsx      # Full AI chat with citations + engine badge
└── pages/
    ├── HomePage.jsx                # Dual: Landing page (guest) / Dashboard (auth)
    ├── CompanyPage.jsx             # Protected company research page
    ├── LoginPage.jsx               # Sign-in with redirect-back support
    └── RegisterPage.jsx            # Registration with password strength hints
```

---

## 4. Routes and Access Control

| Path | Access | Component | Notes |
|---|---|---|---|
| / | Public | HomePage | Renders LandingPage or Dashboard based on auth |
| /login | Public | LoginPage | Accepts state.from for post-login redirect |
| /register | Public | RegisterPage | Redirects to / on success |
| /company/:ticker | PROTECTED | CompanyPage | Unauthenticated users redirected to /login |

ProtectedRoute saves the intended URL in location state so users are redirected back after login.

---

## 5. Authentication Flow

1. POST /api/auth/login or /api/auth/register
2. Response: { token, user }
3. Stored in localStorage as "terminal_token" and "terminal_user"
4. AuthContext state updated (user, token)
5. All api.js requests include: Authorization: Bearer <token>

### Token Lifecycle
- Expiry: 24 hours
- No automatic refresh - user must re-login on expiry
- On mount: AuthContext calls GET /api/auth/me to verify token validity
- On 401: api.js interceptor clears localStorage and dispatches auth-changed event

### Development Auth Bypass
When NODE_ENV=development and ALLOW_DEV_AUTH_BYPASS=true in backend/.env:
- Requests with no token fall back to User ID 1
- Requests with invalid/expired tokens also fall back to User ID 1

---

## 6. Component Reference

### Header.jsx
- Sticky navigation with auth-aware search
- User dropdown: name, email, role badge, Sign Out button
- Get Started and Sign In CTAs for guests
- No developer/database status signals

### Footer.jsx
- Brand, platform links, tech stack, contact info
- System status pills (subtle, non-intrusive)
- Copyright with dynamic year
- Replaces old StatusBar (raw DB/PORT signals removed)

### ProtectedRoute.jsx
- Shows loading spinner while auth state resolves
- Redirects to /login with intended URL in state

### AiAnalystPanel.jsx
Key state:
- messages: chat history (role, content, citations, meta)
- llmStatus: synced from mount-time poll AND each query response
- docContext: document count and concall availability

Engine Badge Sync (v2.0): After each response, engineDetails from the API updates llmStatus so the header badge reflects what was ACTUALLY used - not just what was configured at load time.

Gemini Error Banner: When llmStatus.gemini_error is non-null, a red warning bar shows with the specific error (e.g. "404 model deprecated").

---

## 7. API Integration

### Axios Instance (src/services/api.js)
Base URL: VITE_API_URL or http://localhost:5000/api
- Request interceptor: Attaches Authorization: Bearer <token>
- Response interceptor: On 401 - clears localStorage, dispatches auth-changed

### Backend Endpoints Used

| Method | Path | Auth Required | Description |
|---|---|---|---|
| POST | /api/auth/login | No | Login, returns JWT |
| POST | /api/auth/register | No | Register, returns JWT |
| GET | /api/auth/me | Yes | Verify token |
| POST | /api/auth/logout | Yes | Logout |
| GET | /api/companies | No | List/search companies |
| GET | /api/companies/:ticker | No | Company profile |
| GET | /api/companies/:ticker/financials | No | Financial statements |
| POST | /api/chat/query | YES | AI Analyst question |
| GET | /api/chat/sessions | Yes | Chat history |

### RAG Service Endpoints (direct from frontend)

| Method | Path | Description |
|---|---|---|
| GET | /llm/status | LLM engine status |
| GET | /documents/:company_id | Document list |
| GET | /pdf/:document_id | PDF viewer |

---

## 8. LLM Engine System

### Workflow
1. On mount: AiAnalystPanel calls GET /llm/status for initial state
2. On question: POST /api/chat/query -> Express -> POST /query -> FastAPI RAG
3. RAG tries Gemini first (if GEMINI_API_KEY set), falls back to local extraction
4. Response includes engine_details: { provider, model, badge, gemini_error }
5. Frontend syncs llmStatus from engine_details after each response

### Engine States

| State | Header Badge | Warning Banner |
|---|---|---|
| Gemini active, working | Green Gemini badge | None |
| Gemini configured but failed | Amber Local Extractive | Red bar with error |
| No key configured | Amber Local Extractive | None |

### Fixing Your Gemini API Key
Keys must start with "AIza...". Key starting with "AQ." is NOT a valid Gemini key.
1. Visit aistudio.google.com/app/apikey
2. Create new key
3. Add to rag-service/.env: GEMINI_API_KEY=AIza...
4. Restart uvicorn

---

## 9. Configuration

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
VITE_RAG_URL=http://localhost:8000
```

### Backend (backend/.env)
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_terminal
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=24h
RAG_SERVICE_URL=http://localhost:8000
ALLOW_DEV_AUTH_BYPASS=true
```

### RAG Service (rag-service/.env)
```
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_terminal
GEMINI_API_KEY=AIza...your_valid_key
```

---

## 10. Running Locally

```powershell
# Frontend
cd frontend
npm install
npm run dev        # http://localhost:5173

# Production build
npm run build      # -> dist/

# Backend tests
cd backend
npm test           # 8 test suites
```

---

## 11. Known Limitations and Fixes Applied

| Issue | Status | Notes |
|---|---|---|
| Gemini badge shows wrong engine | FIXED | Now synced from each query response |
| Gemini error not surfaced | FIXED | Red warning banner with specific error |
| No protected routes | FIXED | /company/:ticker requires login |
| Ticker tape with fake prices | FIXED | Removed entirely |
| DB/PORT developer status bar | FIXED | Replaced with enterprise Footer |
| Misleading connection error | FIXED | 401 now shows auth error, not connection error |
| Dev auth bypass not enabled | FIXED | ALLOW_DEV_AUTH_BYPASS=true added to .env |
| JWT token expired not handled | FIXED | Dev bypass catches expired tokens gracefully |
