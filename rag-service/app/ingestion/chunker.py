from typing import List, Dict, Any
from app.config.settings import settings

class Chunker:
    """
    Chunks document text and transcripts into semantic windows
    with metadata preservation and sliding overlap.
    """
    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap or settings.chunk_overlap

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Rough estimate: 1 word is approx 1.33 tokens (or len(text)/4)."""
        words = len(text.split())
        return max(1, int(words * 1.33))

    def chunk_text(self, text: str) -> List[str]:
        """
        Splits a string into chunks respecting paragraph and sentence boundaries.
        """
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        current_chunk_words = []

        target_words = int(self.chunk_size / 1.33)
        overlap_words = int(self.chunk_overlap / 1.33)

        for p in paragraphs:
            p_words = p.split()
            if len(current_chunk_words) + len(p_words) <= target_words:
                current_chunk_words.extend(p_words)
            else:
                if current_chunk_words:
                    chunks.append(" ".join(current_chunk_words))
                    # Retain overlap words
                    current_chunk_words = current_chunk_words[-overlap_words:] + p_words
                else:
                    # If single paragraph is larger than target_words, split by words
                    for i in range(0, len(p_words), target_words - overlap_words):
                        slice_words = p_words[i:i + target_words]
                        chunks.append(" ".join(slice_words))
                    current_chunk_words = []

        if current_chunk_words:
            chunks.append(" ".join(current_chunk_words))

        return chunks if chunks else [text]

    def chunk_transcript_turns(self, turns: List[Dict[str, Any]], company_id: int, document_id: int) -> List[Dict[str, Any]]:
        """
        Chunks transcript speaker turns while preserving speaker and role metadata.
        """
        chunks_output = []
        chunk_idx = 0
        target_words = int(self.chunk_size / 1.33)

        for turn in turns:
            turn_text = turn["content"]
            words = turn_text.split()
            speaker_header = f"{turn['speaker_name']} ({turn['speaker_role']}): "

            if len(words) <= target_words:
                # Keep the turn whole
                full_content = f"{speaker_header}{turn_text}"
                chunks_output.append({
                    "company_id": company_id,
                    "document_id": document_id,
                    "chunk_index": chunk_idx,
                    "content": full_content,
                    "token_count": self.estimate_tokens(full_content),
                    "page_number": None,
                    "speaker_name": turn["speaker_name"],
                    "speaker_role": turn["speaker_role"],
                    "is_management": turn["is_management"],
                    "section": turn["section"],
                })
                chunk_idx += 1
            else:
                # Split long management statement into parts, keeping speaker header
                sub_chunks = self.chunk_text(turn_text)
                for sub in sub_chunks:
                    part_content = f"{speaker_header}{sub}"
                    chunks_output.append({
                        "company_id": company_id,
                        "document_id": document_id,
                        "chunk_index": chunk_idx,
                        "content": part_content,
                        "token_count": self.estimate_tokens(part_content),
                        "page_number": None,
                        "speaker_name": turn["speaker_name"],
                        "speaker_role": turn["speaker_role"],
                        "is_management": turn["is_management"],
                        "section": turn["section"],
                    })
                    chunk_idx += 1

        return chunks_output

    def chunk_pdf_pages(self, pages: List[Dict[str, Any]], company_id: int, document_id: int) -> List[Dict[str, Any]]:
        """
        Chunks PDF page text preserving page numbers.
        """
        chunks_output = []
        chunk_idx = 0

        for page in pages:
            page_num = page["page_number"]
            page_text = page["text"]
            page_chunks = self.chunk_text(page_text)

            for c in page_chunks:
                chunks_output.append({
                    "company_id": company_id,
                    "document_id": document_id,
                    "chunk_index": chunk_idx,
                    "content": c,
                    "token_count": self.estimate_tokens(c),
                    "page_number": page_num,
                    "speaker_name": None,
                    "speaker_role": None,
                    "is_management": True, # Official annual report is authoritative management disclosure
                    "section": f"Page {page_num}",
                })
                chunk_idx += 1

        return chunks_output

chunker = Chunker()
