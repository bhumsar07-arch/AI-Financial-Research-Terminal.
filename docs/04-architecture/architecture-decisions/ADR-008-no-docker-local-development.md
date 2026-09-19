# ADR-008: No Docker Containerization for Local Development

* **Status**: Accepted
* **Date**: September 2026

## Context
Docker and Docker Compose are often used to containerize multi-service applications. However, the developer is currently unfamiliar with Docker. Attempting to introduce Docker, multi-stage builds, volume networking, Docker desktop virtualization, and container debugging at this stage would create cognitive overload and distract from learning the core disciplines of full-stack engineering, PostgreSQL, and AI/RAG.

## Decision
We strictly **exclude Docker and Docker Compose** from the current project. All components run locally on the host machine using standard package management and CLI commands.

## Rationale
1. **Developer Accessibility**: The developer can run services natively using standard tools:
   - Frontend: `npm run dev` (Vite)
   - Express Backend: `npm run dev` (Node.js)
   - Python RAG: `uvicorn app.main:app --reload` (Python virtual environment)
   - Database: Local native PostgreSQL server (Windows service)
2. **Direct Debugging**: When an error occurs, it is immediately visible in the terminal or IDE debugger without needing to inspect container logs, bridge networks, or volume mounts.
3. **Focus on Software Quality**: Keeps the focus squarely on building a stellar financial terminal, clean API design, and verifiable RAG pipelines. Containerization can be explored later as an advanced deployment topic.

## Consequences
* **Positive**: Rapid local iteration, zero Docker troubleshooting, intuitive file system interactions.
* **Negative**: Requires developer to install Node.js, Python 3.10+, and PostgreSQL locally.
