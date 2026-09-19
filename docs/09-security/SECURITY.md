# Security Architecture & Best Practices — AI Financial Research Terminal

## 1. Security Philosophy

Financial terminals deal with sensitive user activity, proprietary investment queries, and business calculations. Security must be baked into every layer of the architecture, not retrofitted as an afterthought.

---

## 2. Layer-by-Layer Security Controls

### 2.1 Identity & Authentication Security
* **Password Hashing**: Stored passwords use `bcrypt` with a minimum salt rounds of 10. Plaintext passwords are never logged, transmitted in error messages, or stored in memory longer than necessary.
* **Stateless JWT Tokens**: Tokens are signed using `HS256` with a strong 256-bit cryptographically random secret (`JWT_SECRET`). Expiration is enforced (24 hours).
* **Token Sanitization**: The payload contains only minimal non-sensitive identifiers (`sub: user_id`, `email`, `role`).
* **Route Protection**: Middleware intercepts incoming requests to private endpoints, extracts the Bearer token, verifies signature and expiration, and rejects invalid tokens with HTTP 401.

### 2.2 Database & Data Access Security
* **SQL Injection Immunity**: All queries use **Drizzle ORM** parameterized queries. No dynamic string interpolation (`"SELECT * FROM " + input`) is ever permitted.
* **Least Privilege**: The application database user should only have permissions on the application database schema.
* **Cascade Isolation**: Deleting a user account cascades to their private chat sessions and watchlists, leaving no orphaned personal data.

### 2.3 API & Transport Security
* **Input Validation & Sanitization**: Incoming request bodies are validated against schemas before execution. Any unexpected fields or malformed data types trigger an immediate HTTP 400 Bad Request.
* **CORS (Cross-Origin Resource Sharing)**: Express CORS middleware is strictly configured to only allow requests originating from the trusted frontend origin (`http://localhost:5173` in development).
* **HTTP Security Headers**: Use `helmet` in Express to set essential headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).
* **Rate Limiting**: Rate limiting middleware (`express-rate-limit`) applied to sensitive endpoints (e.g., maximum 5 login attempts per minute per IP to prevent brute-force attacks).

### 2.4 AI & RAG Security
* **Prompt Injection Defense**: User queries are treated as untrusted strings. System prompts explicitly instruct the model to ignore any instructions embedded in user queries attempting to override analyst behavior or leak internal prompt instructions.
* **Groundedness Sandboxing**: System prompts forbid the LLM from making claims without retrieved evidence.
* **Safe File Uploads**: During document ingestion, files are validated for MIME type (`application/pdf`), maximum size (< 50MB), and filenames are sanitized to prevent directory traversal (`../../etc/passwd`).

### 2.5 Secrets Management & Git Hygiene
* **Zero Secrets in Repository**: `.env` is explicitly ignored by `.gitignore`.
* **Environment Templates**: A `.env.example` file is provided documenting required variable names without values.
* **Audit Checks**: Automated pre-commit checks or manual reviews ensure no API keys or database connection strings are staged.
