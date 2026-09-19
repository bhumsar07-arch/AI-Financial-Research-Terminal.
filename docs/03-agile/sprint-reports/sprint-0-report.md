# Sprint 0 Report — Planning & Architecture

* **Sprint**: Sprint 0
* **Sprint Goal**: Establish complete system architecture, relational database schema, REST API contracts, RAG pipeline design, and Agile documentation framework before starting code implementation.
* **Status**: **Completed**

---

## 1. Planned vs Completed

### Planned:
- [x] Project vision, problem statement, objectives, and scope documentation.
- [x] Functional and non-functional requirements specification.
- [x] User stories with Gherkin acceptance criteria.
- [x] Prioritized product backlog with story points.
- [x] 9-Sprint development roadmap.
- [x] System, backend, and RAG architecture documents.
- [x] Architecture Decision Records (ADR 001 through ADR 008).
- [x] Relational schema and visual Mermaid ER diagram with pgvector specifications.
- [x] Complete REST API documentation for Express and Python FastAPI.
- [x] Document ingestion, transcript processing, and RAG evaluation plans.
- [x] Test plan, test cases, and security baseline.
- [x] Definition of Done and Risk Register.
- [x] Git repository initialization and `.gitignore` setup.

### Completed:
- All 13 planning and design modules successfully created in the `docs/` hierarchy.

### Not Completed:
- None. All Sprint 0 deliverables achieved.

---

## 2. Key Decisions & Technical Insights
1. **Decoupled Backends**: Express.js serves as the application gateway and business logic core, while Python/FastAPI handles the heavy AI/RAG tasks. This prevents Python asynchronous blocking and maintains a standard web backend pattern.
2. **PostgreSQL as Single Source of Truth**: Utilizing `pgvector` inside PostgreSQL allows both structured financial data and unstructured vector chunks to live in one ACID-compliant database, eliminating the need for a separate external vector database.
3. **Deterministic Math Over LLM Math**: Hard rules enforced: financial metrics must be computed deterministically in JavaScript to guarantee 100% accuracy.
4. **Conference Call Transcript Attribution**: Special data structures defined in the schema (`speaker_name`, `speaker_role`, `is_management`, `section`) to prevent attributing analyst questions to company management.

---

## 3. What I Learned in Sprint 0
* The critical importance of planning schema relationships (e.g., distinguishing document chunks from documents, linking chat messages to sessions) prior to writing code.
* How to balance institutional financial needs (verifiable page citations, audit trails) with cutting-edge vector search capabilities.
* Why keeping Agile paperwork concise yet rigorous provides a credible project history for technical evaluation.

---

## 4. Next Sprint
* **Sprint 1**: Express.js + PostgreSQL + Drizzle ORM setup, connection pool, initial database schema migration, and base API health check.
