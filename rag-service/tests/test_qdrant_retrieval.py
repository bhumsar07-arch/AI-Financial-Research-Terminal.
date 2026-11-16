import json
from pathlib import Path

from langchain_core.documents import Document

from app.retrieval import vector_search


class FakeVectorStore:
    def __init__(self):
        self.filter = None

    def similarity_search_with_score(self, query, k, filter):
        self.filter = filter
        return [
            (Document(
                page_content="Export restrictions affected ITC's agriculture trading revenue.",
                metadata={
                    "chunk_id": "12:0",
                    "chunk_index": 0,
                    "company_id": 12,
                    "document_id": 44,
                    "document_title": "ITC FY24 Transcript",
                    "document_type": "conference_call_transcript",
                    "page_number": 6,
                    "speaker_name": "CFO",
                    "speaker_role": "Chief Financial Officer",
                    "is_management": True,
                    "section": "Q&A",
                    "token_count": 12,
                },
            ), 0.82)
        ]


def test_search_uses_company_filter_and_returns_citation_metadata(monkeypatch):
    store = FakeVectorStore()
    monkeypatch.setattr(vector_search, "get_vector_store", lambda: store)

    chunks = vector_search.search_chunks("Why did agriculture revenue decline?", company_id=12, top_k=3)

    assert store.filter.must[0].key == "metadata.company_id"
    assert store.filter.must[0].match.value == 12
    assert chunks[0]["document_title"] == "ITC FY24 Transcript"
    assert chunks[0]["speaker_name"] == "CFO"
    assert chunks[0]["chunk_id"] == "12:0"
    assert chunks[0]["search_method"] == "qdrant_langchain"


def test_benchmark_contains_reference_answers():
    benchmark = Path(__file__).parents[1] / "app" / "evaluation" / "benchmark.json"
    cases = json.loads(benchmark.read_text(encoding="utf-8"))

    assert len(cases) >= 4
    assert all(case.get("question") and case.get("reference") and case.get("expected_source") for case in cases)
