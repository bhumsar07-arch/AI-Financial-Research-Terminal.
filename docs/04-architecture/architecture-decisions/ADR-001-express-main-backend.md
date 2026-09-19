# ADR-001: Express.js as the Main Application Backend

* **Status**: Accepted
* **Date**: September 2026

## Context
The application requires a robust, scalable backend to manage user authentication, session state, REST API validation, database interactions, financial ratio computations, and gateway routing to the Python AI service.

## Decision
We chose **Express.js (Node.js)** as the main application backend.

## Rationale
1. **Separation of Concerns**: Web API logic (auth, user profiles, watchlists, relational data) is decoupled from computationally intensive AI tasks.
2. **Ecosystem & Performance**: Node.js has an asynchronous event-driven I/O model ideal for standard web REST endpoints and proxying requests.
3. **Simplicity for Learning**: Express is lightweight, minimal, and transparent, making it easy to understand middleware, routing, and HTTP lifecycles without framework bloat.
4. **Familiarity**: JavaScript runs across both frontend (React) and main backend (Node), reducing cognitive overhead for a solo developer.

## Consequences
* **Positive**: Fast development velocity, huge community support, easy integration with Drizzle ORM and PostgreSQL.
* **Negative**: Requires a separate microservice for Python-specific AI/ML libraries, meaning two services must run locally during development.
