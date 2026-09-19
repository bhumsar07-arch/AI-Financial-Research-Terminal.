# RAG Evaluation Framework — AI Financial Research Terminal

## 1. Overview & Evaluation Philosophy

In financial research, an unmeasured AI system is a dangerous AI system. We evaluate RAG performance across two distinct dimensions:
1. **Retrieval Performance**: Did the system retrieve the exact relevant passages from the filings/transcripts?
2. **Generation Quality**: Is the generated response grounded in the retrieved text, and does it directly answer the user's question without hallucination?

---

## 2. Core Metrics

| Metric | Target | Formula / Description |
| :--- | :--- | :--- |
| **Faithfulness** | **> 85%** | $\frac{\text{Number of Claims Supported by Evidence}}{\text{Total Claims in Generated Answer}}$. Evaluates groundedness and absence of hallucination. |
| **Answer Relevance** | **> 80%** | Semantic similarity between the user's query and the generated answer, ensuring the model stays on topic. |
| **Context Precision** | **> 75%** | Proportion of retrieved chunks that contain relevant ground-truth facts. Penalizes retrieving noisy or irrelevant passages. |
| **Context Recall** | **> 85%** | Proportion of ground-truth evidence sentences successfully retrieved in the top K chunks. |

---

## 3. Ground-Truth Test Dataset (ITC Benchmark Suite)

The evaluation suite tests 20 curated financial questions covering diverse document types:

| Test ID | Question | Expected Source Document | Expected Speaker / Section |
| :--- | :--- | :--- | :--- |
| **EVAL-01** | *"Why did ITC's agribusiness revenues decline in FY24?"* | FY24 Annual Report / Q4 Transcript | Management Discussion / CFO (Export bans on wheat/rice) |
| **EVAL-02** | *"What caused margin pressure in the Paperboards & Packaging business in FY24?"* | Q4 FY24 Transcript | Sanjiv Puri, MD (Wood cost inflation & cheap Chinese imports) |
| **EVAL-03** | *"What was the capital allocation strategy discussed for the Hotels demerger?"* | EGM / Investor Presentation / Transcript | Management Remarks (Demerger ratio, asset-right strategy) |
| **EVAL-04** | *"What concerns did sell-side analysts raise regarding FMCG-Others volume growth?"* | Q3 / Q4 FY24 Transcript | Analyst Q&A (Rural demand recovery speed) |
| **EVAL-05** | *"What was ITC's gross margin and operating margin in FY24?"* | Deterministic Financials (PostgreSQL) | Express Backend deterministic calculation |

---

## 4. Automated Evaluation Pipeline

In Sprint 7, an automated evaluation runner (`python -m app.evaluation.runner`) will:
1. Iterate over the ground-truth benchmark questions.
2. Execute the RAG retrieval and generation pipeline.
3. Compute metrics using LLM-as-a-Judge (following standard Ragas / TruLens methodology).
4. Output a summary report:
   ```text
   =============================================
   RAG EVALUATION BENCHMARK RESULTS (ITC LIMITED)
   =============================================
   Total Test Cases:        20
   Context Precision:       82.4% (PASS >= 75%)
   Context Recall:          88.1% (PASS >= 85%)
   Faithfulness:            91.5% (PASS >= 85%)
   Answer Relevance:        86.0% (PASS >= 80%)
   Avg Retrieval Latency:   142 ms
   Avg Generation Latency:  1850 ms
   =============================================
   OVERALL STATUS: PASSED
   =============================================
   ```
