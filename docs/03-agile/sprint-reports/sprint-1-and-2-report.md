# Sprint 1 & 2 Report — Backend Scaffolding, Database & Authentication

* **Sprints Completed**: Sprint 1 (Express + PostgreSQL + Drizzle) & Sprint 2 (Authentication & JWT)
* **Goal**: Build a fully functional Node.js Express backend connected to PostgreSQL via Drizzle ORM, with complete user authentication (registration, bcrypt hashing, login, JWT verification, and protected routes).
* **Status**: **Completed & Tested**

---

## 1. What Was Planned & Delivered

| Task / Item | Description | Status |
| :--- | :--- | :--- |
| **PB-101** | Express.js project setup with ES Modules, environment loader, and logger | **Done** |
| **PB-102** | PostgreSQL connection pool and Drizzle ORM configuration | **Done** |
| **PB-103** | Drizzle schemas for all 8 tables and automated migrations | **Done** |
| **PB-104** | Centralized error handler and `/api/health` connectivity check | **Done** |
| **PB-201** | User registration with input validation and bcrypt password hashing (10 salt rounds) | **Done** |
| **PB-202** | User login with credential checking and signed JWT issuance | **Done** |
| **PB-203** | Auth middleware (`authenticateToken`) and protected `GET /api/auth/me` | **Done** |
| **PB-204** | Logout endpoint (`POST /api/auth/logout`) | **Done** |
| **Testing** | Automated test suite (`node --test tests/api.test.js`) verifying all flows | **Done (2/2 Passed)** |

---

## 2. Key Technical Implementations

1. **Native ES Modules**:
   * All backend code uses modern JavaScript (`import` / `export`) with `"type": "module"` in `package.json`. No TypeScript build complications.
2. **Drizzle ORM & PostgreSQL**:
   * 8 tables created: `users`, `companies`, `financial_metrics`, `documents`, `document_chunks`, `chat_sessions`, `chat_messages`, `watchlists`.
   * Foreign keys enforce referential integrity and cascading deletes.
3. **Defense-in-Depth Security**:
   * Passwords are never stored in plaintext. They are hashed using `bcryptjs` with 10 salt rounds.
   * Password hashes are stripped before sending user objects back in API responses.
   * `helmet` adds standard HTTP security headers.
   * `cors` allows local frontend access from port 5173.
   * Stateless JWT tokens carry signed user claims with 24-hour expiration.

---

## 3. Test Results Summary

```text
✔ API Health Check: GET /api/health returns 200 with DB status
✔ Authentication Flow: Register, Duplicate Prevention, Login, and Protected /me
Total tests: 2 | Passed: 2 | Failed: 0
```

---

## 4. Next Sprint
* **Sprint 3 — Companies & Financial Data**:
  - Seed company profile for **ITC Limited**.
  - Seed historical financial statements (FY2021 to FY2025).
  - Implement deterministic calculation service for financial ratios (Operating Margin, Net Margin, RoE, Debt-to-Equity).
  - Create `/api/companies` and `/api/companies/:ticker/financials` endpoints.
