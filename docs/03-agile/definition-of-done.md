# Definition of Done (DoD) — AI Financial Research Terminal

A user story, task, or sprint increment is considered **DONE** only when all applicable criteria in this checklist are verified. Merely writing code does not make a feature complete.

---

## 1. Code Quality & Implementation Checklist
- [ ] **Functional Completeness**: The code implements all acceptance criteria specified in the user story.
- [ ] **No Dead Code or Placeholders**: Temporary mocks, commented-out dead code, and hardcoded secrets have been removed.
- [ ] **Modular Architecture**: Code adheres to the established project structure (routes -> controllers -> services -> db).
- [ ] **Defensive Error Handling**: All asynchronous promises and database calls have proper `try/catch` or error middleware.
- [ ] **Input Validation**: All incoming API request bodies and query parameters are validated and sanitized.

---

## 2. Database & Schema Checklist
- [ ] **Migrations Used**: Any changes to database schema are executed via Drizzle Kit migrations (`drizzle-kit generate` / `drizzle-kit push`), never through unversioned manual SQL hacks.
- [ ] **Data Integrity**: Foreign keys, unique constraints, and non-null constraints are enforced.
- [ ] **Indices Configured**: Appropriate indexes (B-tree on foreign keys, HNSW/IVFFlat on vector embeddings) are in place.

---

## 3. Testing & Verification Checklist
- [ ] **Manual Verification**: The feature has been manually tested and verified locally with expected and edge-case inputs.
- [ ] **Automated Tests**: Unit or integration tests exist covering the happy path and primary error conditions.
- [ ] **All Tests Pass**: The test suite runs cleanly without unhandled rejections or failures.

---

## 4. Security & Environment Checklist
- [ ] **Zero Secrets in Git**: No API keys, database credentials, or JWT secrets are committed to the repository.
- [ ] **Parameterization**: All SQL queries use parameterized queries or Drizzle ORM query builders.
- [ ] **Password Security**: Passwords are never returned in JSON responses or written to logs.

---

## 5. Documentation & Demonstration Checklist
- [ ] **Documentation Updated**: Relevant markdown documentation (API specs, schema docs, sprint report) reflects the changes.
- [ ] **Working Demonstration**: The feature can be executed and demonstrated end-to-end using standard local commands.
- [ ] **Atomic Git Commit**: Code is committed with a clear, conventional commit message (e.g., `feat: implement jwt auth middleware`).
