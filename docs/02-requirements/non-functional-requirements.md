# Non-Functional Requirements — AI Financial Research Terminal

## 1. Performance & Latency Requirements (NFR-PERF)

* **NFR-PERF-01**: Standard REST endpoints (Authentication, Company profile, Financial statements, Watchlist) must respond within **< 150 ms** under normal local load.
* **NFR-PERF-02**: Vector retrieval (pgvector similarity search with metadata filtering) must complete within **< 200 ms** over an initial corpus of up to 50,000 chunks.
* **NFR-PERF-03**: End-to-end RAG query latency (Express -> Python -> Retrieval -> Rerank -> LLM Generation -> Express -> React) should complete within **< 3.5 seconds** (assuming standard LLM API streaming/response times).
* **NFR-PERF-04**: Database connections in Express must be managed via an efficient connection pool (postgres-js / node-postgres) to prevent connection starvation.

---

## 2. Accuracy, Faithfulness & Groundedness (NFR-ACC)

* **NFR-ACC-01**: **Zero Numerical Hallucination**: Ratios, compound metrics, and historical numbers displayed on the UI must match the verified PostgreSQL record with 100% mathematical precision.
* **NFR-ACC-02**: **Grounding Threshold**: RAG answers must achieve a minimum **Faithfulness score of > 85%** on the benchmark test suite. Claims not backed by context chunks are strictly prohibited.
* **NFR-ACC-03**: **Attribution Integrity**: Any claim based on executive outlook or conference call commentary must be explicitly qualified with phrases like *"Management stated..."* or *"According to the CFO during the Q4 call..."*.
* **NFR-ACC-04**: **Analyst Distinction**: Analyst questions must never be represented as company guidance or official positions.

---

## 3. Security & Data Protection (NFR-SEC)

* **NFR-SEC-01**: Passwords must be hashed using `bcrypt` with a work factor of at least 10 (or `argon2id`). Plaintext passwords must never be stored, logged, or cached.
* **NFR-SEC-02**: API communications must enforce authorization checks on private routes using signed JWT tokens validated on every request.
* **NFR-SEC-03**: All SQL queries must use parameterized statements or Drizzle ORM query builders to completely eliminate SQL injection vulnerabilities.
* **NFR-SEC-04**: Input validation must be applied to all incoming request bodies and query parameters using schemas (e.g., Zod or Joi) to reject malformed data before execution.
* **NFR-SEC-05**: Environment secrets (`DATABASE_URL`, `JWT_SECRET`, `LLM_API_KEY`) must reside exclusively in local `.env` files and must never be committed to Git.
* **NFR-SEC-06**: Safe File Ingestion: Uploaded documents must be validated for MIME type, file size (< 50 MB), and sanitized filenames to prevent directory traversal attacks.

---

## 4. Usability & UI Aesthetics (NFR-UX)

* **NFR-UX-01**: The interface must feature a modern, sleek financial terminal aesthetic (Bloomberg/FactSet-inspired dark mode, high-contrast typography, clear tabular alignments, subtle glassmorphism/borders).
* **NFR-UX-02**: Charts must be interactive (hover tooltips, multi-series toggles, zoom/filter by fiscal year) using Recharts.
* **NFR-UX-03**: User feedback: Loading spinners, skeleton placeholders, and error toasts must inform the user during asynchronous actions.
* **NFR-UX-04**: Citations in the AI chat panel must be clickable, previewing the referenced document, page number, and speaker in a drawer or modal.

---

## 5. Reliability, Error Handling & Maintainability (NFR-MAINT)

* **NFR-MAINT-01**: Centralized error middleware in Express must catch all uncaught synchronous and asynchronous errors, returning uniform JSON error responses (`{ "error": true, "message": "..." }`) without leaking stack traces in production.
* **NFR-MAINT-02**: If the Python RAG service is offline or unreachable, Express must return a clear HTTP 503 Service Unavailable error explaining that the AI service is currently starting or unreachable.
* **NFR-MAINT-03**: Database migrations must be managed deterministically using Drizzle Kit (`drizzle-kit generate` and `drizzle-kit push`/`migrate`). No manual production schema tweaks.
* **NFR-MAINT-04**: Codebase must be modular, adhering to single-responsibility architecture (routes -> controllers -> services -> db).
