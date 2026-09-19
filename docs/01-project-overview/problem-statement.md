# Problem Statement — AI Financial Research Terminal

## 1. The Real-World Challenge

Modern financial research is burdened by an overwhelming volume of complex, unstructured disclosures. When an analyst researches a company such as **ITC Limited**, they must navigate:
* **200+ page Annual Reports**: Packed with statutory legal notes, governance disclosures, and complex segmented footnotes.
* **Quarterly Earnings Releases**: Condensed tables that report changes in net profit or revenue without immediate explanatory context.
* **Investor Presentations**: High-level graphic summaries that often present favorable narratives without detailed scrutiny.
* **Earnings Conference Call Transcripts**: Hour-long discussions between management and institutional sell-side analysts containing critical explanations of margin pressures, input cost inflation, regulatory risks, and strategic guidance.

---

## 2. Key Pain Points

### A. The "Why" Information Gap
Standard market screeners (e.g., Yahoo Finance, screener.in, Google Finance) excel at displaying what happened (e.g., *"Operating profit fell 4.2%"*), but fail to explain **why** it happened. Answering the "why" requires reading through hundreds of lines of transcript text and Management Discussion & Analysis (MD&A) sections.

### B. High Cost of Manual Search
Analysts spend 70% of their research time searching through dense PDF documents, Ctrl+F searching keywords across multiple documents, and copying snippets into spreadsheets.

### C. General-Purpose LLM Failures
When users ask ChatGPT or generic LLMs financial questions:
1. **Mathematical Inaccuracy**: LLMs perform mental arithmetic unpredictably and hallucinate financial metrics.
2. **Lack of Recency and Specificity**: Generic LLMs lack access to the latest quarterly filing or transcript.
3. **No Source Verification**: They provide confident-sounding answers without verifiable page numbers or speaker references.
4. **Failure to Distinguish Commentary**: They treat an analyst's skeptical question as an established company fact, or treat management's optimistic forecast as guaranteed performance.

---

## 3. The Proposed Solution

The **AI Financial Research Terminal** solves these problems by:
1. **Structuring Quantitative Data**: Storing standardized financial statements in PostgreSQL and computing ratios (margins, growth rates, debt metrics) deterministically in Node.js.
2. **Targeted Qualitative RAG**: Indexing official Annual Reports and Earnings Call Transcripts with **pgvector**, preserving speaker metadata (CEO vs CFO vs Analyst) and section metadata.
3. **Evidence-Grounded Querying**: Synthesizing answers strictly from retrieved source chunks, enforcing exact citation of document titles, page numbers, and speaker roles.
4. **Interactive Financial Interface**: A clean terminal interface displaying interactive Recharts visualizations alongside the AI research assistant.
