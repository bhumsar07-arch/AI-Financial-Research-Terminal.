# ADR-005: Separate Python/FastAPI Service for AI & RAG

* **Status**: Accepted
* **Date**: September 2026

## Context
Document parsing (PDFs, table extraction), natural language chunking, embeddings, cross-encoder reranking, and LLM orchestration are dominated by the Python data science and machine learning ecosystem (e.g., PyPDF, sentence-transformers, LangChain, Tiktoken). Attempting to perform heavy AI document engineering in Node.js leads to sub-par libraries or wrapping fragile native binaries. Conversely, building the entire full-stack web backend in Python (e.g., Django or Flask) obscures web engineering fundamentals in the Node ecosystem.

## Decision
We chose to build a **dedicated Python microservice using FastAPI**, isolated strictly to document ingestion, transcript parsing, embeddings, vector retrieval, and LLM synthesis. Express.js acts as the main application gateway.

## Rationale
1. **Best Tool for the Job**: Python provides the world's most mature libraries for PDF layout parsing, natural language processing, and semantic chunking.
2. **FastAPI High Performance**: FastAPI uses Starlette and Pydantic, offering asynchronous REST endpoints, automatic OpenAPI documentation, and fast JSON serialization.
3. **Decoupled Failure Domains**: An intensive document processing job or temporary LLM API timeout will not crash or block the Express server handling user logins or financial dashboards.
4. **Architectural Realism**: This microservice pattern accurately reflects enterprise software where specialized ML services are decoupled from customer-facing core business APIs.

## Consequences
* **Positive**: Full access to state-of-the-art Python AI libraries; clean system boundaries.
* **Negative**: Two runtime environments must be configured locally (`npm` for Express/React and `python venv` for FastAPI).
