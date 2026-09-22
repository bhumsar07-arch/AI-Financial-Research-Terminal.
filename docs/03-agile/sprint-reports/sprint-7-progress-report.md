# Sprint 7 Progress Report — PDF Financial Extractor & Filings Hub

* **Sprint**: Sprint 7 (Advanced Features & Automation)
* **Status**: **In Progress (Core Ingestion Deliverables Completed)**

---

## 1. What Has Been Built & Delivered in Sprint 7

| Task / Feature | Description | Status |
| :--- | :--- | :--- |
| **Real PDF Financial Extractor** | Automated parser (`rag-service/app/ingestion/extract_pdf_financials.py`) extracting official balance sheets and income statements directly from uploaded corporate PDFs | **Completed** |
| **Seeded Data Elimination** | Cleaned out all artificial mock/seed financial data from the database, ensuring 100% of figures originate strictly from primary corporate documents | **Completed** |
| **Dynamic Multi-Year Compilation** | Automatic aggregation of multi-year financial statements and quarterly results across all uploaded PDF documents | **Completed** |
| **Filings & Transcripts Hub** | Interactive UI tab showing all indexed corporate filings with page counts, document types, fiscal years/quarters, and direct click-to-open PDF viewer | **Completed** |
| **Watchlist CRUD** | User watchlist API endpoints and frontend watchlist management | Planned |
| **Company Comparison** | Multi-company side-by-side metric comparison table | Planned |
| **RAG Evaluation Suite** | Automated benchmarking framework for Faithfulness, Precision, and Recall | Planned |

---

## 2. Technical Highlights: Real PDF Financial Extractor

1. **Extraction Pipeline (`extract_pdf_financials.py`)**:
   - Uses `pypdf` to scan financial statement pages in annual reports and investor presentations.
   - Extracts:
     - Revenue from Operations
     - Total Income
     - Cost of Materials & Employee Expenses
     - EBITDA & Operating Profit
     - Profit Before Tax & Net Profit (PAT)
     - Total Assets, Shareholder Equity & Total Debt
     - Free Cash Flow & Operating Cash Flow
   - Computes deterministic ratios: Gross Margin, Operating Margin, Net Margin, RoE, and Debt-to-Equity.
   - Inserts clean, verified financial rows into `financial_metrics` table with `is_audited: true`.

2. **Zero Hallucination Compliance**:
   - Enforces the terminal's core philosophy: deterministic financials from official documents, qualitative synthesis via grounded RAG.
   - When new filings are added, the compilation updates dynamically without hardcoded constants.

---

## 3. Remaining Deliverables for Sprint 7 Completion

1. **PB-701: Watchlists**:
   - Backend CRUD routes (`POST /api/watchlist`, `DELETE /api/watchlist/:ticker`, `GET /api/watchlist`).
   - Frontend watchlist sidebar widget and quick-access watchlist bar.
2. **PB-702: Company Comparison**:
   - Side-by-side comparison view allowing analysts to compare 2+ companies across key financial metrics and ratios.
3. **PB-704: RAG Evaluation Benchmark**:
   - Quantitative evaluation script testing answer faithfulness and citation accuracy across standard equity research query sets.
