# Test Plan — AI Financial Research Terminal

## 1. Testing Strategy & Pyramid

The project utilizes a multi-layered testing strategy combining unit tests, integration tests, and domain-specific RAG evaluations.

```text
               ▲
              / \
             /   \      RAG Evaluation (20 Benchmark Q&A Cases)
            / RAG \     Faithfulness, Recall, Precision, Latency
           /───────\
          /         \   Integration Tests (Supertest / Pytest)
         /Integrat'n \  API Endpoints, DB Transactions, Auth Flows
        /─────────────\
       /   Unit Tests  \ Unit Tests (Jest & Pytest)
      /                 \ Financial math, schema validators, chunkers
     └───────────────────┘
```

---

## 2. Testing Frameworks & Tools

| Component | Framework / Tool | Purpose |
| :--- | :--- | :--- |
| **Express Backend** | **Jest** + **Supertest** | Unit testing calculation algorithms, route validation, and integration testing API endpoints with test database. |
| **Python RAG Service** | **Pytest** + **HTTPX** | Testing PDF parsing, transcript speaker extraction, chunking logic, and FastAPI endpoints. |
| **Frontend React** | **Vitest** + **Testing Library** | Component rendering, chart rendering, auth context verification. |
| **Database** | PostgreSQL Test DB | Transactional test isolation with automatic rollbacks. |

---

## 3. Test Stages by Sprint

* **Sprint 1**: DB connection pool test, migration verification test.
* **Sprint 2**: Password hashing unit tests, JWT issuance/validation tests, registration duplicate rejection test.
* **Sprint 3**: Deterministic ratio calculation unit tests (Gross margin, Operating margin, RoE, Debt/Equity), company search tests.
* **Sprint 4**: Frontend component tests, protected route navigation tests.
* **Sprint 5**: Transcript parser regex tests, PDF extraction tests, pgvector insertion tests.
* **Sprint 6**: End-to-end RAG query flow test, citation formatting test.
* **Sprint 7**: Watchlist CRUD tests, multi-company comparison test, RAG benchmark evaluation run.
* **Sprint 8**: Full regression test suite execution, security vulnerability scan.
