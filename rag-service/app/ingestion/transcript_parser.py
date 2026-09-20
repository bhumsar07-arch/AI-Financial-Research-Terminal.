import re
from typing import List, Dict, Any

class TranscriptParser:
    """
    Custom rule-based parser for earnings conference call transcripts.
    Detects speaker transitions, executive roles, management vs analyst attribution,
    and sections (Prepared Remarks vs Question & Answer).
    """

    # Common executive titles that indicate Company Management
    MANAGEMENT_TITLES = [
        "chairman",
        "managing director",
        "chief executive officer",
        "ceo",
        "chief financial officer",
        "cfo",
        "executive director",
        "president",
        "head of investor relations",
        "management",
    ]

    # Non-speaker structural labels to ignore
    IGNORE_LABELS = [
        "corporate participants",
        "conference call participants",
        "participants",
        "date",
        "disclaimer",
        "presentation",
    ]

    # Regex to match speaker headers in transcripts, e.g.:
    # "Sanjiv Puri - Chairman and Managing Director:"
    # "Percy Panthaki - Analyst, CLSA:"
    # "Supratim Dutta - CFO:"
    # "Operator:"
    SPEAKER_PATTERN = re.compile(
        r"^([A-Z][A-Za-z\.\s]+?)(?:\s*[-–—]\s*([^:]+))?:\s*(.*)$"
    )

    SECTION_QA_MARKERS = [
        "question-and-answer session",
        "question and answer session",
        "q&a session",
        "questions and answers",
        "q&a",
    ]

    SECTION_REMARKS_MARKERS = [
        "prepared remarks",
        "management presentation",
        "executive presentation",
        "opening remarks",
    ]

    @classmethod
    def is_management_role(cls, speaker_name: str, role: str) -> bool:
        """Determines if a speaker is company management or external analyst/operator."""
        combined = f"{speaker_name} {role}".lower()
        if "analyst" in combined or "operator" in combined or "broker" in combined:
            return False
        return any(title in combined for title in cls.MANAGEMENT_TITLES)

    @classmethod
    def parse_transcript(cls, text: str) -> List[Dict[str, Any]]:
        """
        Parses full transcript text into structured speaker turns.
        Returns a list of turns with speaker metadata and section tagging.
        """
        lines = text.splitlines()
        current_section = None
        turns = []

        current_speaker_name = None
        current_speaker_role = None
        current_is_mgmt = False
        current_content_lines = []

        def save_current_turn():
            if current_speaker_name and current_content_lines:
                turn_text = "\n".join(current_content_lines).strip()
                if turn_text:
                    turns.append({
                        "speaker_name": current_speaker_name,
                        "speaker_role": current_speaker_role or "Speaker",
                        "is_management": current_is_mgmt,
                        "section": current_section or "Prepared Remarks",
                        "content": turn_text,
                    })

        for raw_line in lines:
            line = raw_line.strip()
            if not line:
                continue

            # Check for section transition markers (e.g. === Question-and-Answer Session ===)
            line_lower = line.lower()
            if any(marker in line_lower for marker in cls.SECTION_QA_MARKERS):
                save_current_turn()
                current_section = "Q&A Session"
                current_speaker_name = None
                current_content_lines = []
                continue
            elif any(marker in line_lower for marker in cls.SECTION_REMARKS_MARKERS):
                save_current_turn()
                current_section = "Prepared Remarks"
                current_speaker_name = None
                current_content_lines = []
                continue

            # If we haven't reached a section header yet, skip title/preamble
            if current_section is None:
                continue

            # Check if line matches an ignored label (like Date: or Corporate Participants:)
            clean_check = line.lower().split(":")[0].strip()
            if clean_check in cls.IGNORE_LABELS:
                continue

            # Check if this line is a new speaker header
            match = cls.SPEAKER_PATTERN.match(line)
            if match and len(match.group(1).split()) <= 5:
                potential_name = match.group(1).strip()
                if potential_name.lower() in cls.IGNORE_LABELS:
                    continue

                # Save previous speaker turn before starting a new one
                save_current_turn()

                name = potential_name
                role = (match.group(2) or "").strip() or "Speaker"
                inline_content = match.group(3).strip()

                if name.lower() == "operator":
                    role = "Conference Operator"

                current_speaker_name = name
                current_speaker_role = role
                current_is_mgmt = cls.is_management_role(name, role)
                current_content_lines = [inline_content] if inline_content else []
            else:
                if current_speaker_name:
                    current_content_lines.append(line)

        # Save the final speaker turn
        save_current_turn()

        return turns
