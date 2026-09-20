import io
import hashlib
from typing import List, Dict, Any
from pypdf import PdfReader

class PDFParser:
    """
    Extracts text page-by-page from official company filings (Annual Reports, 10-Ks).
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
        Returns a list of dicts: [{'page_number': 1, 'text': '...', 'char_count': 120}]
        """
        reader = PdfReader(io.BytesIO(file_bytes))
        pages_data = []

        for idx, page in enumerate(reader.pages):
            page_num = idx + 1
            extracted_text = page.extract_text() or ""
            # Clean up whitespace
            cleaned_text = "\n".join(
                line.strip() for line in extracted_text.splitlines() if line.strip()
            )
            
            if cleaned_text:
                pages_data.append({
                    "page_number": page_num,
                    "text": cleaned_text,
                    "char_count": len(cleaned_text),
                })

        return pages_data
