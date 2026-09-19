# Document Ingestion Pipeline — AI Financial Research Terminal

This document describes the pipeline for discovering, validating, parsing, chunking, and embedding official PDF documents (Annual Reports, Quarterly Results, Presentations).

---

## 1. Ingestion Lifecycle

```text
[Official Source PDF]
         │
         ▼
[1. File Validation]
  - Validate MIME type (application/pdf)
  - Validate file size (< 50MB)
  - Verify sha256 checksum to prevent duplicate processing
         │
         ▼
[2. Text & Layout Extraction (PyPDF / pdfplumber)]
  - Extract text page-by-page
  - Track 1-based page numbers accurately
  - Filter out headers, footers, page numbering artifacts
         │
         ▼
[3. Section Detection & Structural Tagging]
  - Identify major sections (MD&A, Auditor's Report, Financial Statements, Segment Results)
         │
         ▼
[4. Semantic Chunking with Sliding Window]
  - Target chunk size: 500-600 tokens
  - Chunk overlap: 50-80 tokens (maintains sentence context across boundaries)
  - Respect paragraph and sentence breaks (never split numbers or key phrases)
         │
         ▼
[5. Vector Embedding Generation]
  - Batch embed text chunks (batches of 32 or 64) via embedding model
         │
         ▼
[6. Transactional Storage in PostgreSQL]
  - Insert document record in `documents`
  - Batch insert chunks into `document_chunks` with `vector(1536)`
```

---

## 2. Chunking Configuration

| Parameter | Value | Rationale |
| :--- | :--- | :--- |
| **Chunk Size** | 500 tokens (~375 words) | Balances semantic richness with high retrieval specificity. |
| **Chunk Overlap**| 60 tokens (~45 words) | Prevents losing context when an explanation spans a chunk boundary. |
| **Splitter** | Recursive Character Splitter | Splits on `\n\n` (paragraphs), then `\n`, then sentences (`. `). |
| **Metadata** | `page_number`, `document_id`, `company_id`, `section` | Mandatory for building verifiable citations in UI. |

---

## 3. Duplicate Prevention
Before ingesting a document, a SHA-256 hash is computed over the raw PDF binary:
```python
import hashlib

def calculate_checksum(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()
```
If a document with the identical checksum already exists in the `documents` table for the specified `company_id` and `fiscal_year`, the ingestion pipeline skips reprocessing, saving compute and embedding costs.
