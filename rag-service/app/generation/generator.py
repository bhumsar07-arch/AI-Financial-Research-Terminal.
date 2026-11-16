"""
Answer generator for the AI Financial Research Analyst.

Supports two modes:
  1. LangChain + Google Gemini — set GEMINI_API_KEY in .env
  2. Local extractive synthesis — runs 100% offline, no API keys needed.
     Extracts and ranks the most relevant evidence passages and composes
     a structured answer with speaker attributions and citations.

Also handles casual conversational inputs (greetings, small talk) gracefully
without triggering the full RAG pipeline.
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
import dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config.settings import settings

# Load environment variables across possible terminal .env paths
def _reload_env():
    for p in [
        Path(__file__).resolve().parent.parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent.parent / "backend" / ".env",
        Path(__file__).resolve().parent.parent.parent.parent / ".env",
    ]:
        if p.exists():
            dotenv.load_dotenv(dotenv_path=p, override=True)

_reload_env()

def get_configured_gemini_key() -> Optional[str]:
    _reload_env()
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# ---------------------------------------------------------------------------
# Grounding Prompt Template for LLM-based generation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an expert equity research analyst for an institutional financial terminal.
You answer questions about companies using ONLY the provided source documents.
You must follow these strict rules:

1. ONLY use information from the provided EVIDENCE passages below.
2. ALWAYS attribute statements to their source: speaker name, role, and document.
3. Use exact quotes where possible, marked with quotation marks.
4. If the evidence doesn't contain enough information, say "Based on available documents, I cannot fully answer this question."
5. Structure your response with clear paragraphs.
6. End your response with a brief "Key Takeaway" summary.
7. Do NOT hallucinate or invent any financial figures, dates, or statements not in the evidence.
8. When citing conference call speakers, use format: "According to [Name], [Role]..."
9. When citing documents, reference the document title and page if available.
"""


def _build_evidence_context(chunks: List[Dict[str, Any]]) -> str:
    """Formats retrieved chunks into a numbered evidence block for the LLM prompt."""
    evidence_parts = []
    for i, chunk in enumerate(chunks, 1):
        source_label = chunk.get("document_title", "Unknown Document")
        speaker = chunk.get("speaker_name")
        role = chunk.get("speaker_role")
        page = chunk.get("page_number")
        section = chunk.get("section", "")
        score = chunk.get("score", 0)

        header = f"[EVIDENCE {i}] (Relevance: {score})"
        header += f"\nSource: {source_label}"
        if speaker and speaker != "None":
            header += f"\nSpeaker: {speaker}"
            if role and role != "Speaker":
                header += f" ({role})"
        if page:
            header += f"\nPage: {page}"
        if section:
            header += f"\nSection: {section}"

        evidence_parts.append(f"{header}\n---\n{chunk['content']}\n")

    return "\n".join(evidence_parts)


def _build_citations(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Builds structured citation objects from retrieved chunks."""
    citations = []
    for i, chunk in enumerate(chunks, 1):
        citations.append({
            "index": i,
            "chunk_id": chunk.get("chunk_id"),
            "document_id": chunk.get("document_id"),
            "document_title": chunk.get("document_title", "Unknown"),
            "document_type": chunk.get("document_type", "unknown"),
            "speaker_name": chunk.get("speaker_name"),
            "speaker_role": chunk.get("speaker_role"),
            "is_management": chunk.get("is_management", False),
            "section": chunk.get("section"),
            "page_number": chunk.get("page_number"),
            "relevance_score": chunk.get("score", 0),
            "excerpt": chunk.get("content", "")[:300],  # Truncated preview
        })
    return citations


# ---------------------------------------------------------------------------
# Mode 1: LangChain + Google Gemini
# ---------------------------------------------------------------------------

def _generate_with_gemini(query: str, evidence: str) -> tuple[str, str]:
    """Generate a grounded answer with a LangChain prompt/model/output chain."""
    api_key = get_configured_gemini_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    os.environ["GOOGLE_API_KEY"] = api_key
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "EVIDENCE PASSAGES\n{evidence}\n\nANALYST QUESTION\n{query}\n\nGive a concise, evidence-grounded answer."),
    ])
    model = ChatGoogleGenerativeAI(model=settings.llm_model, temperature=0.2, max_retries=2)
    chain = prompt | model | StrOutputParser()
    return chain.invoke({"evidence": evidence, "query": query}), settings.llm_model


# ---------------------------------------------------------------------------
# Mode 2: Local extractive synthesis (no API key required)
# ---------------------------------------------------------------------------

def _generate_local_synthesis(query: str, chunks: List[Dict[str, Any]]) -> str:
    """
    Builds a structured answer from retrieved evidence chunks without an LLM.
    Uses extractive approach: selects the most relevant passages, attributes them
    to speakers/documents, and composes a professional research note.
    """
    if not chunks:
        return "No relevant documents found for this query. Please ensure documents have been ingested for this company."

    query_lower = query.lower()
    answer_parts = []

    # Group chunks by source type
    transcript_chunks = [c for c in chunks if c.get("document_type") == "conference_call_transcript"]
    report_chunks = [c for c in chunks if c.get("document_type") != "conference_call_transcript"]

    # Opening context
    top_chunk = chunks[0]
    answer_parts.append(
        f"Based on analysis of {len(chunks)} relevant passages from company filings and disclosures:\n"
    )

    # Management commentary from transcripts
    if transcript_chunks:
        answer_parts.append("**Management Commentary:**\n")
        for tc in transcript_chunks[:3]:
            speaker = tc.get("speaker_name", "Management")
            role = tc.get("speaker_role", "")
            content = tc["content"]

            # Clean up the content — remove the speaker header if present
            cleaned = re.sub(r"^[A-Za-z\s\.]+ \([^)]+\):\s*", "", content)

            # Truncate very long passages for readability
            if len(cleaned) > 400:
                cleaned = cleaned[:400].rsplit(" ", 1)[0] + "..."

            role_display = f", {role}" if role and role != "Speaker" else ""
            answer_parts.append(
                f'According to **{speaker}**{role_display}: "{cleaned}"\n'
            )

    # Document-based evidence from reports/PPTs
    if report_chunks:
        answer_parts.append("\n**From Company Filings:**\n")
        for rc in report_chunks[:2]:
            doc_title = rc.get("document_title", "Company Filing")
            page = rc.get("page_number")
            content = rc["content"]

            if len(content) > 400:
                content = content[:400].rsplit(" ", 1)[0] + "..."

            page_ref = f" (Page {page})" if page else ""
            answer_parts.append(
                f'From *{doc_title}*{page_ref}: "{content}"\n'
            )

    # Key Takeaway
    answer_parts.append("\n**Key Takeaway:**")
    if transcript_chunks:
        top_speaker = transcript_chunks[0].get("speaker_name", "management")
        answer_parts.append(
            f" The above evidence from {top_speaker} and company documents "
            f"provides direct insight into this topic. For the most comprehensive analysis, "
            f"review the full source documents cited above."
        )
    else:
        answer_parts.append(
            " The referenced company filings provide factual disclosures on this topic. "
            "No conference call transcripts are currently available for additional management commentary."
        )

    return "\n".join(answer_parts)


# ---------------------------------------------------------------------------
# Casual query detection
# ---------------------------------------------------------------------------

CASUAL_PATTERNS = [
    r"^(hi|hello|hey|hii|hiiii|yo|sup|hola)\W*$",
    r"^(good\s*(morning|afternoon|evening|night|day))\W*$",
    r"^(how\s*are\s*you|how\s*r\s*u|how\s*you\s*doing|u\s*ok|you\s*okay)\W*$",
    r"^(thanks|thank\s*you|thx|ty|cheers|great|awesome|nice|cool|ok|okay|alright)\W*$",
    r"^(what('s|\s+is)\s+your\s+name|who\s+are\s+you)\W*$",
    r"^(bye|goodbye|see\s*you|cya|later)\W*$",
    r"^(help|what\s+can\s+you\s+do|what\s+do\s+you\s+do)\W*$",
]

CASUAL_RESPONSES = {
    "greeting": [
        "Hey! I'm your AI financial analyst. Ask me anything about the company — earnings, strategy, margins, what management said in the last earnings call, all of it.",
        "Hello! Ready to dig into some financials. What would you like to know?",
        "Hi! What financial question can I help you with today?",
    ],
    "how_are_you": [
        "Doing great, thanks for asking! Now — what financial question can I help you crack?",
        "All good! Ready to analyze some numbers. What do you want to know?",
    ],
    "thanks": [
        "Happy to help! Anything else you'd like to explore?",
        "Of course! Feel free to ask another question anytime.",
        "Glad that was useful! What else can I dig into for you?",
    ],
    "who_are_you": [
        "I'm your AI Financial Research Analyst — I read annual reports, earnings call transcripts, and investor presentations so you don't have to. Ask me anything about the company.",
    ],
    "help": [
        "I can help you with:\n- **Earnings analysis** — revenue, EBITDA, margins, profit trends\n- **Management commentary** — what the CEO/CFO said in earnings calls\n- **Strategy & outlook** — growth plans, capital allocation, guidance\n- **Document deep dives** — any specific section of an annual report or filing\n\nJust ask your question naturally!",
    ],
    "bye": [
        "See you! Come back whenever you need to dig into more financials.",
        "Goodbye! Happy analyzing!",
    ],
    "default": [
        "Hey! Go ahead and ask me a financial question — I'll analyze the company's documents and give you a grounded, cited answer.",
    ],
}

import random

def is_casual_query(query: str) -> bool:
    """Returns True if the query is a greeting, small talk, or non-financial casual message."""
    q = query.strip().lower()
    # Very short queries that aren't numbers or tickers
    if len(q.split()) <= 2 and not any(char.isdigit() for char in q):
        for pattern in CASUAL_PATTERNS:
            if re.match(pattern, q, re.IGNORECASE):
                return True
    return False


def handle_casual_query(query: str) -> Dict[str, Any]:
    """Returns a natural conversational response without triggering RAG."""
    q = query.strip().lower()

    if re.match(CASUAL_PATTERNS[0], q, re.IGNORECASE):  # greeting
        responses = CASUAL_RESPONSES["greeting"]
    elif re.match(CASUAL_PATTERNS[2], q, re.IGNORECASE):  # how are you
        responses = CASUAL_RESPONSES["how_are_you"]
    elif re.match(CASUAL_PATTERNS[3], q, re.IGNORECASE):  # thanks
        responses = CASUAL_RESPONSES["thanks"]
    elif re.match(CASUAL_PATTERNS[4], q, re.IGNORECASE):  # who are you
        responses = CASUAL_RESPONSES["who_are_you"]
    elif re.match(CASUAL_PATTERNS[7], q, re.IGNORECASE):  # help
        responses = CASUAL_RESPONSES["help"]
    elif re.match(CASUAL_PATTERNS[6], q, re.IGNORECASE):  # bye
        responses = CASUAL_RESPONSES["bye"]
    else:
        responses = CASUAL_RESPONSES["default"]

    return {
        "answer": random.choice(responses),
        "citations": [],
        "source_count": 0,
        "llm_provider": "conversational",
        "engine_details": {
            "provider": "conversational",
            "name": "Conversational Agent",
            "badge": "Chat",
            "mode": "conversational",
            "model": "rule-based",
            "gemini_error": None,
        },
        "concall_available": False,
        "is_casual": True,
    }


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def generate_answer(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    use_llm: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates a grounded research answer from retrieved evidence chunks.

    Args:
        query: The analyst's question.
        retrieved_chunks: List of chunk dicts from vector_search.search_chunks().
        use_llm: Provider override ('gemini') or None for configured provider.

    Returns:
        Dict with keys: answer, citations, source_count, llm_provider, concall_available.
    """
    # Handle casual conversational inputs gracefully
    if is_casual_query(query):
        return handle_casual_query(query)

    if not retrieved_chunks:
        has_concall = False
        return {
            "answer": "I couldn't find any relevant information in the ingested documents for this query. "
                      "Please make sure documents have been uploaded and ingested for this company.",
            "citations": [],
            "source_count": 0,
            "llm_provider": "none",
            "concall_available": has_concall,
        }

    # Build structured citations
    citations = _build_citations(retrieved_chunks)

    # Check if concalls are in the evidence
    has_concall = any(
        c.get("document_type") == "conference_call_transcript"
        for c in retrieved_chunks
    )

    # Use LangChain Gemini when configured; keep the extractive fallback available offline.
    evidence_text = _build_evidence_context(retrieved_chunks)
    llm_provider = "local_extractive"
    gemini_error = None
    gemini_key = get_configured_gemini_key()
    provider = use_llm or os.getenv("LLM_PROVIDER", "auto")
    answer = _generate_local_synthesis(query, retrieved_chunks)
    gemini_model = settings.llm_model
    if provider not in ("auto", "gemini"):
        raise ValueError("Only the Gemini provider is configured for LangChain generation")
    if gemini_key:
        try:
            answer, gemini_model = _generate_with_gemini(query, evidence_text)
            llm_provider = "gemini"
        except Exception as exc:
            print(f"[Generator] LangChain Gemini call failed; using extractive fallback: {exc}")
            gemini_error = str(exc)

    engine_details = {
        "provider": llm_provider,
        "name": f"Google Gemini ({gemini_model})" if llm_provider == "gemini" else "Local Extractive Synthesis",
        "badge": "Gemini AI" if llm_provider == "gemini" else "Local Extractive",
        "mode": "cloud_llm" if llm_provider == "gemini" else "offline_extractive",
        "model": gemini_model if llm_provider == "gemini" else "extractive-ranker-v1",
        "embedding_model": "all-MiniLM-L6-v2 (semantic)",
        "gemini_error": gemini_error,
    }

    return {
        "answer": answer,
        "citations": citations,
        "source_count": len(citations),
        "llm_provider": llm_provider,
        "engine_details": engine_details,
        "concall_available": has_concall,
    }


# ---------------------------------------------------------------------------
# Diagnostics & Status Functions
# ---------------------------------------------------------------------------

def check_llm_status(test_ping: bool = False) -> Dict[str, Any]:
    """Report LangChain Gemini configuration and optionally perform a live ping."""
    gemini_key = get_configured_gemini_key()
    if not gemini_key:
        return {
            "status": "offline_local",
            "active_provider": "local_extractive",
            "engine_name": "Local Extractive Synthesis Engine",
            "model": "extractive-ranker-v1",
            "is_gemini_active": False,
            "api_key_configured": False,
            "message": "No Gemini API key detected; using local extractive fallback.",
        }

    masked = gemini_key[:4] + "..." + gemini_key[-4:] if len(gemini_key) > 8 else "***"
    ping_result = None
    if test_ping:
        try:
            os.environ["GOOGLE_API_KEY"] = gemini_key
            ping_result = str(ChatGoogleGenerativeAI(model=settings.llm_model, max_retries=1).invoke("Reply with PONG").content).strip()
        except Exception as exc:
            return {
                "status": "error",
                "active_provider": "local_extractive",
                "engine_name": "Local Extractive Synthesis Engine",
                "model": "extractive-ranker-v1",
                "is_gemini_active": False,
                "api_key_configured": True,
                "masked_key": masked,
                "message": f"LangChain Gemini test call failed: {exc}",
                "error": str(exc),
            }

    return {
        "status": "connected",
        "active_provider": "gemini",
        "engine_name": f"Google Gemini through LangChain ({settings.llm_model})",
        "model": settings.llm_model,
        "is_gemini_active": True,
        "api_key_configured": True,
        "masked_key": masked,
        "ping_test": ping_result,
        "embedding_model": "all-MiniLM-L6-v2 (semantic)",
        "message": f"Google Gemini ({settings.llm_model}) is configured through LangChain.",
    }


def set_gemini_key(api_key: str) -> Dict[str, Any]:
    """Validate a Gemini key through LangChain, then persist it to rag-service/.env."""
    clean_key = api_key.strip()
    if not clean_key:
        raise ValueError("API key cannot be empty")
    os.environ["GOOGLE_API_KEY"] = clean_key
    try:
        ChatGoogleGenerativeAI(model=settings.llm_model, max_retries=1).invoke("Reply with PONG")
    except Exception as exc:
        os.environ.pop("GOOGLE_API_KEY", None)
        raise ValueError(f"Gemini API verification failed: {exc}") from exc

    os.environ["GEMINI_API_KEY"] = clean_key
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    lines = env_path.read_text(encoding="utf-8").splitlines(keepends=True) if env_path.exists() else []
    replaced = False
    for index, line in enumerate(lines):
        if line.startswith("GEMINI_API_KEY="):
            lines[index] = f"GEMINI_API_KEY={clean_key}\n"
            replaced = True
    if not replaced:
        lines.append(f"\nGEMINI_API_KEY={clean_key}\n")
    env_path.write_text("".join(lines), encoding="utf-8")

    masked = clean_key[:4] + "..." + clean_key[-4:] if len(clean_key) > 8 else "***"
    return {
        "success": True,
        "message": f"Gemini API key validated and activated successfully ({settings.llm_model})!",
        "masked_key": masked,
        "engine_name": f"Google Gemini ({settings.llm_model})",
        "active_provider": "gemini",
    }
