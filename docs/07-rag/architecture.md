# RAG Architecture

The current RAG architecture uses **PostgreSQL for relational application data** and **Qdrant for vector search**. LangChain provides the embedding, vector-store, and LLM interfaces. Ragas runs offline benchmark evaluations against the same query and generation functions as the FastAPI service.

For the authoritative component flow, data ownership, migration command, and evaluation workflow, see [RAG Service Architecture](../04-architecture/rag-architecture.md), [RAG Pipeline](RAG-PIPELINE.md), and [RAG Evaluation](RAG-EVALUATION.md).
