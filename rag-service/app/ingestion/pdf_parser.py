"""
PDF Parser — extracts text page-by-page from official company filings.

Primary: pdfplumber (preserves table structure, handles complex layouts)
Fallback: pypdf  (fast, handles simple text PDFs)

Why pdfplumber?
  - pypdf's extract_text() flattens tables into garbled strings
  - pdfplumber understands column positions and outputs structured table rows
  - Financial data (revenue tables, P&L statements) retains its row/column meaning
"""

import io
import hashlib
from typing import List, Dict, Any


def _extract_with_pdfplumber(file_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Primary extraction path using pdfplumber.
    Converts tables into pipe-separated text for LLM readability.
    """
    import pdfplumber

    pages_data = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for idx, page in enumerate(pdf.pages):
            page_num = idx + 1
            text_parts = []

            # Extract tables first — convert to readable markdown-style text
            tables = page.extract_tables()
            for table in tables:
                if not table:
                    continue
                for row in table:
                    if row:
                        cleaned_row = " | ".join(
                            str(cell).strip() if cell else "" for cell in row
                        )
                        if cleaned_row.strip(" |"):
                            text_parts.append(cleaned_row)

            # Extract remaining text (non-table text)
            raw_text = page.extract_text(x_tolerance=3, y_tolerance=3) or ""
            for line in raw_text.splitlines():
                stripped = line.strip()
                if stripped:
                    text_parts.append(stripped)

            full_text = "\n".join(text_parts)
            if full_text.strip():
                pages_data.append({
                    "page_number": page_num,
                    "text": full_text,
                    "char_count": len(full_text),
                    "parser": "pdfplumber",
                })

    return pages_data


def _extract_with_pypdf(file_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Fallback extraction path using pypdf.
    Used when pdfplumber is unavailable or raises an error.
    """
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(file_bytes))
    pages_data = []

    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        extracted_text = page.extract_text() or ""
        cleaned_text = "\n".join(
            line.strip() for line in extracted_text.splitlines() if line.strip()
        )
        if cleaned_text:
            pages_data.append({
                "page_number": page_num,
                "text": cleaned_text,
                "char_count": len(cleaned_text),
                "parser": "pypdf",
            })

    return pages_data


class PDFParser:
    """
    Extracts text page-by-page from official company filings (Annual Reports, Quarterly Results).

    Uses pdfplumber as primary parser for table-structure preservation.
    Falls back to pypdf for compatibility with older or simple-layout PDFs.
    Preserves 1-based page numbers for citation tracking in the frontend UI.
    """

    @staticmethod
    def calculate_checksum(file_bytes: bytes) -> str:
        """Compute SHA-256 checksum to prevent duplicate ingestion."""
        return hashlib.sha256(file_bytes).hexdigest()

    @staticmethod
    def extract_pages(file_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Extracts text from PDF bytes page by page.
        Returns: [{'page_number': 1, 'text': '...', 'char_count': N, 'parser': 'pdfplumber'}]
        """
        # Try pdfplumber first (better table handling)
        try:
            pages = _extract_with_pdfplumber(file_bytes)
            if pages:
                parser_used = pages[0].get("parser", "pdfplumber")
                print(f"[PDFParser] Extracted {len(pages)} pages using {parser_used}")
                return pages
        except ImportError:
            print("[PDFParser] pdfplumber not installed, using pypdf fallback")
        except Exception as e:
            print(f"[PDFParser] pdfplumber failed ({e}), falling back to pypdf")

        # Fallback to pypdf
        try:
            pages = _extract_with_pypdf(file_bytes)
            print(f"[PDFParser] Extracted {len(pages)} pages using pypdf (fallback)")
            return pages
        except Exception as e:
            print(f"[PDFParser] Both parsers failed: {e}")
            return []
