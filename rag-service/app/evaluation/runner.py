"""Run the curated Ragas benchmark against the live Qdrant + LangChain pipeline.

Run from rag-service with: python -m app.evaluation.runner
Requires Qdrant, PostgreSQL metadata, ingested documents, and GEMINI_API_KEY.
"""

from __future__ import annotations

import json
import math
import os
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from langchain_google_genai import ChatGoogleGenerativeAI
from ragas import EvaluationDataset, evaluate
from ragas.llms import LangchainLLMWrapper
from ragas.metrics import (
    Faithfulness,
    FactualCorrectness,
    LLMContextPrecisionWithReference,
    LLMContextRecall,
)

from app.config.settings import settings
from app.database.connection import get_db_connection
from app.generation.generator import generate_answer
from app.retrieval.vector_search import search_chunks


BASE_DIR = Path(__file__).resolve().parent
BENCHMARK_PATH = BASE_DIR / "benchmark.json"
REPORTS_DIR = Path(__file__).resolve().parents[2] / "reports"


def _company_id_for(ticker: str) -> int:
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM companies WHERE ticker = %s;", (ticker,))
        row = cur.fetchone()
        if not row:
            raise RuntimeError(f"Company ticker {ticker!r} is missing from PostgreSQL.")
        return int(row[0])
    finally:
        cur.close()
        conn.close()


def run_evaluation() -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("Set GEMINI_API_KEY or GOOGLE_API_KEY to run the Ragas judge and LangChain answer model.")
    os.environ["GOOGLE_API_KEY"] = api_key

    cases = json.loads(BENCHMARK_PATH.read_text(encoding="utf-8"))
    samples: list[dict[str, Any]] = []
    retrieval_ms: list[float] = []
    generation_ms: list[float] = []
    citation_checks: list[bool] = []
    per_case: list[dict[str, Any]] = []

    company_ids = {ticker: _company_id_for(ticker) for ticker in {case["ticker"] for case in cases}}
    for case in cases:
        start = time.perf_counter()
        chunks = search_chunks(case["question"], company_ids[case["ticker"]], top_k=5)
        retrieval_time = (time.perf_counter() - start) * 1000
        start = time.perf_counter()
        response = generate_answer(case["question"], chunks, use_llm="gemini")
        generation_time = (time.perf_counter() - start) * 1000

        contexts = [chunk["content"] for chunk in chunks]
        samples.append({
            "user_input": case["question"],
            "retrieved_contexts": contexts,
            "response": response["answer"],
            "reference": case["reference"],
        })
        expected_source = case["expected_source"].lower()
        citation_titles = [str(citation.get("document_title", "")).lower() for citation in response.get("citations", [])]
        citation_ok = any(expected_source in title for title in citation_titles)
        retrieval_ms.append(retrieval_time)
        generation_ms.append(generation_time)
        citation_checks.append(citation_ok)
        per_case.append({
            "id": case["id"],
            "retrieved_chunks": len(chunks),
            "source_titles": citation_titles,
            "citation_source_match": citation_ok,
            "retrieval_ms": round(retrieval_time, 2),
            "generation_ms": round(generation_time, 2),
        })
        print(f"[{case['id']}] retrieved={len(chunks)} retrieval={retrieval_time:.1f}ms generation={generation_time:.1f}ms")

    dataset = EvaluationDataset.from_list(samples)
    judge = LangchainLLMWrapper(ChatGoogleGenerativeAI(model=settings.llm_model, temperature=0))
    metrics = [
        LLMContextPrecisionWithReference(),
        LLMContextRecall(),
        Faithfulness(llm=judge),
        FactualCorrectness(llm=judge),
    ]
    result = evaluate(dataset=dataset, metrics=metrics, llm=judge)
    scored = result.to_pandas()
    metric_columns = {
        "context_precision": ("context_precision", "llm_context_precision_with_reference"),
        "context_recall": ("context_recall", "llm_context_recall"),
        "faithfulness": ("faithfulness",),
        "factual_correctness": ("factual_correctness",),
    }
    metric_means = {}
    for label, possible_columns in metric_columns.items():
        column = next((name for name in possible_columns if name in scored.columns), None)
        if column and not scored[column].dropna().empty:
            metric_means[label] = round(float(scored[column].dropna().mean()), 4)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    scored.to_csv(REPORTS_DIR / f"ragas-{stamp}.csv", index=False)
    report = {
        "created_at": stamp,
        "model": settings.llm_model,
        "cases": len(cases),
        "metrics": metric_means,
        "citation_source_match_rate": round(sum(citation_checks) / len(citation_checks), 4) if citation_checks else 0,
        "avg_retrieval_ms": round(statistics.mean(retrieval_ms), 2) if retrieval_ms else 0,
        "p95_retrieval_ms": round(sorted(retrieval_ms)[max(0, math.ceil(len(retrieval_ms) * 0.95) - 1)], 2) if retrieval_ms else 0,
        "avg_generation_ms": round(statistics.mean(generation_ms), 2) if generation_ms else 0,
        "p95_generation_ms": round(sorted(generation_ms)[max(0, math.ceil(len(generation_ms) * 0.95) - 1)], 2) if generation_ms else 0,
        "cases_detail": per_case,
        "note": "Scores are actual run results; citation_source_match is a simple source-title check, not a semantic citation judge.",
    }
    report_path = REPORTS_DIR / f"ragas-{stamp}.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    print(f"Saved detailed Ragas results to {report_path}")
    return report


if __name__ == "__main__":
    run_evaluation()
