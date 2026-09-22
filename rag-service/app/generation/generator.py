"""
Answer generator for the AI Financial Research Analyst.

Supports two modes:
  1. External LLM API (Google Gemini or OpenAI) — set GEMINI_API_KEY or OPENAI_API_KEY in .env
  2. Local extractive synthesis — runs 100% offline, no API keys needed.
     Extracts and ranks the most relevant evidence passages and composes
     a structured answer with speaker attributions and citations.

Also handles casual conversational inputs (greetings, small talk) gracefully
without triggering the full RAG pipeline.
"""

import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
import dotenv

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

# Try importing LLM clients (optional dependencies)
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False



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
# Mode 1: LLM-powered generation (Gemini or OpenAI)
# ---------------------------------------------------------------------------

def _generate_with_gemini(query: str, evidence: str) -> tuple[str, str]:
    """
    Generate answer using Google Gemini API.
    Tries candidate models in order to handle Google's model lifecycle/deprecation gracefully.
    """
    api_key = get_configured_gemini_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured")

    genai.configure(api_key=api_key)

    prompt = f"""{SYSTEM_PROMPT}

## EVIDENCE PASSAGES
{evidence}

## ANALYST QUESTION
{query}

## YOUR ANALYSIS
Provide a thorough, evidence-grounded answer:"""

    candidate_models = [
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        "gemini-flash-latest",
        "gemini-3.8-flash",
    ]
    last_exc = None

    for model_name in candidate_models:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text, model_name
        except Exception as e:
            last_exc = e
            continue

    raise last_exc or ValueError("Failed to generate content with any Gemini candidate model")


def _generate_with_openai(query: str, evidence: str) -> str:
    """Generate answer using OpenAI API."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

    client = openai.OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"""## EVIDENCE PASSAGES
{evidence}

## ANALYST QUESTION
{query}

## YOUR ANALYSIS
Provide a thorough, evidence-grounded answer:"""
            }
        ],
        temperature=0.3,
        max_tokens=1500,
    )
    return response.choices[0].message.content


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
        use_llm: Force a specific LLM provider ('gemini', 'openai') or None for auto-detect.

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

    # Determine which generation mode to use
    evidence_text = _build_evidence_context(retrieved_chunks)
    llm_provider = "local_extractive"
    gemini_error = None
    answer = ""

    # Auto-detect or use specified LLM
    gemini_key = get_configured_gemini_key()
    provider = use_llm or os.getenv("LLM_PROVIDER", "auto")

    gemini_model = "gemini-3.5-flash-lite"
    if provider == "gemini" or (provider == "auto" and gemini_key):
        if HAS_GEMINI and gemini_key:
            try:
                answer, used_model = _generate_with_gemini(query, evidence_text)
                llm_provider = "gemini"
                gemini_model = used_model
            except Exception as e:
                print(f"[Generator] Gemini API error, falling back to local: {e}")
                gemini_error = str(e)
                answer = _generate_local_synthesis(query, retrieved_chunks)
        else:
            answer = _generate_local_synthesis(query, retrieved_chunks)

    elif provider == "openai" or (provider == "auto" and os.getenv("OPENAI_API_KEY")):
        if HAS_OPENAI and os.getenv("OPENAI_API_KEY"):
            try:
                answer = _generate_with_openai(query, evidence_text)
                llm_provider = "openai"
            except Exception as e:
                print(f"[Generator] OpenAI API error, falling back to local: {e}")
                answer = _generate_local_synthesis(query, retrieved_chunks)
        else:
            answer = _generate_local_synthesis(query, retrieved_chunks)

    else:
        # Default: local extractive synthesis
        answer = _generate_local_synthesis(query, retrieved_chunks)

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
    """
    Checks if Gemini is available, configured, and responsive.
    Tests candidate models in order to ensure operational health.
    """
    gemini_key = get_configured_gemini_key()

    if not gemini_key:
        return {
            "status": "offline_local",
            "active_provider": "local_extractive",
            "engine_name": "Local Extractive Synthesis Engine",
            "model": "extractive-ranker-v1",
            "is_gemini_active": False,
            "api_key_configured": False,
            "message": "Running on Local Extractive Synthesis. No Gemini API key detected in .env.",
        }

    masked = gemini_key[:4] + "..." + gemini_key[-4:] if len(gemini_key) > 8 else "***"

    if not HAS_GEMINI:
        return {
            "status": "sdk_missing",
            "active_provider": "local_extractive",
            "engine_name": "Local Extractive Synthesis Engine",
            "model": "extractive-ranker-v1",
            "is_gemini_active": False,
            "api_key_configured": True,
            "masked_key": masked,
            "message": "API key present, but 'google-generativeai' package is not installed.",
        }

    ping_result = None
    active_model_name = "gemini-3.5-flash-lite"

    if test_ping:
        try:
            genai.configure(api_key=gemini_key)
            candidate_models = [
                "gemini-3.5-flash-lite",
                "gemini-3.5-flash",
                "gemini-3.6-flash",
                "gemini-flash-latest",
                "gemini-3.8-flash",
            ]
            last_err = None
            ping_success = False

            for m_name in candidate_models:
                try:
                    model = genai.GenerativeModel(m_name)
                    resp = model.generate_content("Ping test. Reply with 'PONG'")
                    if resp and resp.text:
                        ping_result = resp.text.strip()
                        active_model_name = m_name
                        ping_success = True
                        break
                except Exception as e:
                    last_err = e
                    continue

            if not ping_success:
                raise last_err or Exception("Gemini ping failed on all models")

        except Exception as e:
            return {
                "status": "error",
                "active_provider": "local_extractive",
                "engine_name": "Local Extractive Synthesis Engine",
                "model": "extractive-ranker-v1",
                "is_gemini_active": False,
                "api_key_configured": True,
                "masked_key": masked,
                "message": f"Gemini API test call failed: {str(e)}",
                "error": str(e),
            }

    return {
        "status": "connected",
        "active_provider": "gemini",
        "engine_name": f"Google Gemini ({active_model_name})",
        "model": active_model_name,
        "is_gemini_active": True,
        "api_key_configured": True,
        "masked_key": masked,
        "ping_test": ping_result,
        "embedding_model": "all-MiniLM-L6-v2 (semantic)",
        "message": f"Google Gemini ({active_model_name}) is configured and verified active.",
    }


def set_gemini_key(api_key: str) -> Dict[str, Any]:
    """
    Validates and stores the Gemini API key in rag-service/.env.
    """
    clean_key = api_key.strip()
    if not clean_key:
        raise ValueError("API key cannot be empty")

    if not HAS_GEMINI:
        raise ValueError("google-generativeai package is not installed.")

    # Validate against Gemini API across candidate models
    candidate_models = [
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        "gemini-flash-latest",
        "gemini-3.8-flash",
    ]
    verified = False
    active_model_name = "gemini-3.5-flash-lite"
    last_err = None

    for m_name in candidate_models:
        try:
            genai.configure(api_key=clean_key)
            model = genai.GenerativeModel(m_name)
            resp = model.generate_content("Ping")
            if resp and resp.text:
                verified = True
                active_model_name = m_name
                break
        except Exception as e:
            last_err = e
            continue

    if not verified:
        raise ValueError(f"Gemini API verification failed: {str(last_err)}")

    # Update runtime environment
    os.environ["GEMINI_API_KEY"] = clean_key

    # Save to rag-service/.env
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    lines = []
    found = False
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        new_lines = []
        for line in lines:
            if line.startswith("GEMINI_API_KEY="):
                new_lines.append(f"GEMINI_API_KEY={clean_key}\n")
                found = True
            else:
                new_lines.append(line)
        lines = new_lines

    if not found:
        lines.append(f"\nGEMINI_API_KEY={clean_key}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    masked = clean_key[:4] + "..." + clean_key[-4:] if len(clean_key) > 8 else "***"
    return {
        "success": True,
        "message": f"Gemini API key validated and activated successfully ({active_model_name})!",
        "masked_key": masked,
        "engine_name": f"Google Gemini ({active_model_name})",
        "active_provider": "gemini",
    }
