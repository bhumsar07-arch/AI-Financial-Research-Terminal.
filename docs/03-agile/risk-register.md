# Risk Register — AI Financial Research Terminal

This register tracks key technical, data, and architectural risks for the project, along with probability, impact, and proactive mitigation strategies.

---

## Risk Matrix Summary

| ID | Risk Description | Severity | Likelihood | Mitigation Strategy | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | **LLM Hallucination of Financial Numbers** | High | High | Never ask LLM to compute financial numbers. Pass verified metrics from PostgreSQL into prompt context as read-only constants. | Controlled |
| **RSK-02** | **Transcript Speaker Misattribution** | High | Medium | Build a specialized transcript parsing pipeline that identifies speaker tags and role designations, segregating remarks from questions. | Planned (Sprint 5) |
| **RSK-03** | **Large PDF Parsing Token Exhaustion** | High | Medium | Implement semantic chunking (400–800 tokens) with 50-token sliding overlap. Store chunk references and page indices. | Planned (Sprint 5) |
| **RSK-04** | **pgvector Setup & Local Dependencies** | Medium | Medium | Document exact Windows native PostgreSQL + pgvector extension installation steps. Test vector dimension compatibility early. | Active |
| **RSK-05** | **Python Service Latency & Blocking** | Medium | Low | Run Python FastAPI asynchronously with Uvicorn; Express handles user sessions independently; return clear loading states in React. | Controlled |
| **RSK-06** | **Accidental Secret Commit to Git** | High | Medium | Comprehensive `.gitignore` configured from Sprint 0; use `.env.example` templates; use git status checks before commits. | Controlled |
| **RSK-07** | **Scope Creep in Solo Agile Delivery** | Medium | High | Strict adherence to the 9-sprint roadmap. Defer real-time websockets and complex stock brokers to future iterations. | Controlled |
| **RSK-08** | **CORS & Port Conflicts in Local Dev** | Low | Medium | Standardize ports (React: 5173, Express: 5000, FastAPI: 8000, Postgres: 5432) and configure Express CORS middleware explicitly. | Planned (Sprint 1) |
