# RAG Pipeline Specification — AI Financial Research Terminal

This document details the step-by-step technical pipeline for answering financial and strategic questions.

---

## 1. End-to-End Pipeline Stages

```text
[1. User Query] 
       │ "Why did ITC's operating profit margins compress in FY24?"
       ▼
[2. Query Analysis & Filter Extraction]
       │ Identified: Company=ITC (id=1), Metric=Margins, Period=FY24
       ▼
[3. Query Embedding]
       │ Vector representation generated via OpenAI text-embedding-3-small (1536 dim)
       ▼
[4. Hybrid pgvector Retrieval]
       │ SELECT content, page_number, speaker_name, speaker_role, section,
       │        (1 - (embedding <=> query_vector)) AS similarity
       │ FROM document_chunks
       │ WHERE company_id = 1 AND (fiscal_year = 2024 OR fiscal_year IS NULL)
       │ ORDER BY embedding <=> query_vector LIMIT 15;
       ▼
[5. Reranking (Cross-Encoder)]
       │ Scored top 15 chunks using sentence-transformers cross-encoder
       │ Selects top 5 highest contextual chunks
       ▼
[6. Deterministic Financials Fetch]
       │ Query financial_metrics table:
       │ Operating Margin FY23: 33.1%, Operating Margin FY24: 32.3% (-80 bps)
       ▼
[7. Prompt Construction]
       │ Assembles System Prompt + Hard Financial Facts + Ranked Chunks + Attribution Directives
       ▼
[8. LLM Inference & Structured Output]
       │ Streams/Generates synthesis with Markdown formatting and structured citation list
       ▼
[9. Validation & Persistence]
       │ Validates citations match retrieved chunk IDs; saves Q&A to chat_messages
```

---

## 2. Prompt Engineering Specification

The LLM is prompted as an **Equity Research Analyst** with strict institutional constraints:

### System Prompt Template:
```text
You are a Senior Equity Research Analyst Assistant specializing in fundamental company analysis.
You are analyzing verified corporate filings and earnings call transcripts for {company_name} ({ticker}).

CRITICAL OPERATIONAL RULES:
1. HARD FINANCIAL FACTS:
   Use the deterministic financial figures provided in [STRUCTURED FINANCIALS]. These numbers are authoritative. Never invent, extrapolate, or approximate financial numbers.

2. RETRIEVED DOCUMENT EVIDENCE:
   Answer the user's question using ONLY the provided [DOCUMENT EVIDENCE] chunks. If the answer is not present in the evidence, clearly state: "The provided filings and transcripts do not contain information regarding [topic]."

3. MANAGEMENT COMMENTARY vs FINANCIAL FACTS:
   - When citing management remarks or executive guidance, you MUST attribute them explicitly:
     "Management stated that..." or "Chairman Sanjiv Puri highlighted that..."
   - Forward-looking statements must never be presented as guaranteed historical outcomes.

4. ANALYST QUESTIONS vs MANAGEMENT ANSWERS:
   - When citing questions raised by analysts during conference calls, clearly label them:
     "An analyst raised concerns regarding..."
   - Never attribute an analyst's question or assumption to company management.

5. CITATIONS:
   For every factual claim, reference the citation key [C1], [C2], etc. corresponding to the evidence chunk.
```

---

## 3. Metadata Filtering Strategy

To prevent cross-company noise or temporal confusion, metadata filtering is applied during SQL retrieval:

```sql
SELECT 
    id, document_id, content, page_number, speaker_name, speaker_role, section,
    1 - (embedding <=> $1) as similarity_score
FROM document_chunks
WHERE 
    company_id = $2
    AND ($3::int IS NULL OR fiscal_year = $3)
    AND ($4::text[] IS NULL OR document_type = ANY($4))
ORDER BY embedding <=> $1
LIMIT $5;
```
This guarantees that an inquiry about ITC's FY24 margins only searches ITC's FY24 filings and transcripts, eliminating accidental leakage from earlier years or other companies.
