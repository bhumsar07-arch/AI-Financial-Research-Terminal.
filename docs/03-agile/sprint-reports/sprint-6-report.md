# Sprint 6 Report — AI Analyst, Grounded RAG, Gemini 3.6 Flash & PDF Streaming

* **Sprint Completed**: Sprint 6 (AI Analyst & Grounded Chat)
* **Goal**: Build an end-to-end evidence-backed RAG assistant that answers qualitative research queries grounded in corporate filings and transcripts, featuring exact source attribution, Google Gemini LLM synthesis, offline fallback, and click-to-PDF citation exploration.
* **Status**: **Completed & Verified**

---

## 1. What Was Built & Delivered

| Task / Item | Description | Status |
| :--- | :--- | :--- |
| **PB-601** | FastAPI `/query` endpoint: Dense vector similarity retrieval over 1,679 chunks in PostgreSQL | **Done** |
| **PB-602** | Financial domain re-ranking: Combined dense cosine similarity with lexical overlap, strategic section boost, and accounting boilerplate filtering | **Done** |
| **PB-603** | LLM Generation Engine: Direct Google Gemini API (`gemini-3.6-flash`, `gemini-flash-latest`) integration + 100% offline Local Extractive Synthesis fallback | **Done** |
| **PB-604** | Express Gateway orchestrator (`/api/chat/query`) forwarding prompts to FastAPI and persisting chat sessions & messages in PostgreSQL | **Done** |
| **PB-605** | Interactive terminal AI Analyst chat panel (`AiAnalystPanel.jsx`) with clickable citations drawer and real-time LLM Diagnostics modal | **Done** |
| **PDF Streaming** | Direct PDF streaming endpoint (`GET /documents/:id/pdf#page=X`) allowing analysts to jump directly to the exact page of the cited filing | **Done** |

---

## 2. Key Technical Innovations Beyond Initial Plan

1. **Dual-Engine Architecture (Cloud LLM + Offline Fallback)**:
   - **Google Gemini 3.6 Flash**: Synthesizes fluid, institutional-grade equity analysis with strict source attribution when an API key is configured.
   - **Local Extractive Synthesis Engine**: 100% offline, deterministic fallback that ranks and quotes source passages directly with zero external network requests.
   - **Dynamic Model Fallback Chain**: Tries `gemini-3.6-flash` -> `gemini-flash-latest` -> `gemini-2.5-flash` to handle Google API model lifecycle transitions smoothly.

2. **Domain-Specific Financial Re-Ranking & Anti-Boilerplate Filter**:
   - Dense vector models alone often match repetitive accounting policy boilerplate on business questions (due to generic terms like "management", "estimates").
   - Implemented a +0.25 boost for forward-looking strategic commentary (MD&A, Board Report, "ITC Next" Strategy) and a -0.35 penalty on dry accounting policy notes, ensuring analysts receive actual executive commentary.

3. **Audit-Grade Citations with Click-to-PDF Navigation**:
   - Every citation includes document title, document type, page number, speaker name, and speaker role.
   - Clicking a citation opens the official corporate PDF filing scrolled directly to the cited page.

---

## 3. Verification & Live Execution

- **Automated Python Pipeline Test**: Verified `search_chunks` -> domain re-ranking -> `gemini-3.6-flash` generation returning fully attributed analysis.
- **End-to-End Browser UI Verification**:
  - Successfully queried: *"what are the expected growth from management in coming years"*.
  - UI badge verified: `● ✨ Google Gemini (gemini-3.6-flash) · 5 grounded passages`.
  - Detailed synthesis generated covering FMCG TAM headroom, 'ITC Next' Strategy, mother brand extensions, digital acquisitions (>₹1,350 Cr ARR), and IT services AI expansion.

---

## 4. Next Sprint
* **Sprint 7 — Advanced Features & Automation**:
  - Real PDF financial statement extraction (`extract_pdf_financials.py`).
  - Filings & transcripts hub with original PDF links.
  - Watchlist CRUD, company comparison, and automated RAG evaluation.
