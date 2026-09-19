# Backend Architecture — Express.js Main Application

## 1. Architectural Style & Layering

The Express backend follows a strict **Layered (N-Tier) Architecture** to ensure clean separation of concerns, testability, and maintainability.

```text
HTTP Request
     │
     ▼
[Middleware Layer]     ──> (CORS, JSON Parser, Helmet, Auth Token Verification, Rate Limiting)
     │
     ▼
[Routes Layer]         ──> (Route definitions, HTTP method bindings, input schema validators)
     │
     ▼
[Controllers Layer]    ──> (HTTP status codes, request extraction, response formatting)
     │
     ▼
[Services Layer]       ──> (Business logic, financial calculations, calls to Python RAG service)
     │
     ▼
[Database Access (DB)] ──> (Drizzle ORM queries, PostgreSQL connection pool, schema models)
```

---

## 2. Directory Layout

The Express backend is organized cleanly under `backend/`:

```text
backend/
├── src/
│   ├── server.js               # Entry point: starts HTTP server on port 5000
│   ├── app.js                  # Express app setup: middleware, routes, error handlers
│   │
│   ├── config/
│   │   ├── env.js              # Validated environment variables (dotenv)
│   │   └── database.js         # PostgreSQL connection pool & Drizzle client
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT validation & user attachment
│   │   ├── error.middleware.js # Centralized JSON error handler
│   │   └── validate.middleware.js # Request schema validator
│   │
│   ├── routes/
│   │   ├── auth.routes.js      # /api/auth
│   │   ├── company.routes.js   # /api/companies
│   │   ├── financial.routes.js # /api/financials
│   │   ├── document.routes.js  # /api/documents
│   │   ├── chat.routes.js      # /api/chat
│   │   └── watchlist.routes.js # /api/watchlist
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── company.controller.js
│   │   ├── financial.controller.js
│   │   ├── document.controller.js
│   │   ├── chat.controller.js
│   │   └── watchlist.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js      # Password hashing, token signing
│   │   ├── financial.service.js # Deterministic ratio calculations
│   │   ├── company.service.js   # Company metadata queries
│   │   ├── rag.client.js        # Axios/Fetch client communicating with Python service
│   │   └── chat.service.js      # Session and message persistence
│   │
│   ├── db/
│   │   ├── index.js             # Drizzle instance export
│   │   ├── schema/              # Table definitions
│   │   │   ├── users.js
│   │   │   ├── companies.js
│   │   │   ├── financials.js
│   │   │   ├── documents.js
│   │   │   ├── chunks.js
│   │   │   ├── chats.js
│   │   │   └── watchlists.js
│   │   └── migrations/          # Drizzle Kit migration files
│   │
│   └── utils/
│       ├── logger.js            # Structured console/file logger
│       └── apiResponse.js       # Standardized JSON response helper
│
├── drizzle.config.js            # Drizzle Kit configuration
├── package.json                 # Node.js dependencies and scripts ("type": "module")
└── .env                         # Local environment configuration (ignored by Git)
```

---

## 3. Core Technical Decisions

1. **Native ES Modules (`type: module`)**: Modern JavaScript import/export syntax throughout the entire backend.
2. **Drizzle ORM with `postgres` Driver**: High-performance, lightweight, TypeScript-free SQL query builder providing safety and clean migrations.
3. **Deterministic Financial Math Service**: Centralized in `financial.service.js`, computing metrics like:
   $$\text{Operating Margin} = \frac{\text{Operating Profit}}{\text{Total Revenue}} \times 100$$
   $$\text{RoE} = \frac{\text{Net Income}}{\text{Shareholder Equity}} \times 100$$
   $$\text{Debt-to-Equity} = \frac{\text{Total Debt}}{\text{Total Equity}}$$
4. **Standardized API Responses**:
   ```json
   {
     "success": true,
     "data": { ... },
     "message": "Operation completed successfully"
   }
   ```
   Or on error:
   ```json
   {
     "success": false,
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Password must be at least 8 characters long"
     }
   }
   ```
