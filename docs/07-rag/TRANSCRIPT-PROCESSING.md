# Conference Call Transcript Processing — AI Financial Research Terminal

## 1. Why Transcripts Require Custom Handling

Standard document chunkers treat earnings call transcripts as continuous text, causing critical architectural failures:
1. **Speaker Mixing**: A single chunk might start with an analyst expressing skepticism and end with the CFO responding, leading the LLM to misattribute the quote.
2. **Loss of Question/Answer Pairing**: An answer cannot be understood without the question that prompted it.
3. **Loss of Executive Role**: Knowing whether a statement was made by the Chairman/MD (Sanjiv Puri) or an external broker analyst (e.g., from Morgan Stanley or Kotak Securities) is fundamental to equity research.

---

## 2. Transcript Parser Architecture

The transcript processing pipeline applies rule-based heuristic segmentation to identify structure:

```text
Raw Transcript Text
       │
       ▼
[Section Classifier]
  - Locates "Prepared Remarks / Management Presentation"
  - Locates "Question and Answer Session (Q&A)"
       │
       ▼
[Speaker Segmenter]
  - Regex detection of speaker headers:
    Example: "Sanjiv Puri - Chairman and Managing Director:"
    Example: "Percy Panthaki - Analyst, CLSA:"
    Example: "Supratim Dutta - Chief Financial Officer:"
       │
       ▼
[Role & Affiliation Extractor]
  - speaker_name: "Sanjiv Puri"
  - speaker_role: "Chairman and Managing Director"
  - is_management: TRUE
  - section: "Q&A Session"
       │
       ▼
[Dialogue Chunking Strategy]
  - Q&A turns are kept intact whenever possible.
  - If a management response exceeds 600 tokens, it is split on paragraph breaks,
    repeating the Speaker Header on each chunk.
       │
       ▼
[Embedding & Database Storage]
  - Stored in `document_chunks` with rich speaker columns populated.
```

---

## 3. Sample Parsed Chunk Representation

```json
{
  "company_id": 1,
  "document_id": 14,
  "chunk_index": 32,
  "speaker_name": "Supratim Dutta",
  "speaker_role": "Chief Financial Officer",
  "is_management": true,
  "section": "Q&A Session",
  "content": "[Context: Question from Analyst regarding Agribusiness margins]\nSupratim Dutta (CFO): The geopolitical disruptions and export restrictions on certain agricultural commodities such as non-basmati rice and wheat impacted our trading volumes. However, our value-added portfolio, particularly spices and coffee, performed resiliently with double-digit margin expansion.",
  "token_count": 82
}
```

---

## 4. Attribution Rules in Generation

During prompt assembly, transcript chunks are formatted with explicit speaker tags:

```text
[CHUNK C3] (Source: Q4 FY24 Transcript | Speaker: Supratim Dutta, CFO | Role: Management)
"The geopolitical disruptions and export restrictions on certain agricultural commodities..."
```

The system prompt enforces:
* If `is_management == true`, prompt rules require attribution:
  *"According to CFO Supratim Dutta, geopolitical disruptions..."*
* If `is_management == false`, prompt rules require attribution:
  *"An analyst questioned whether export restrictions would continue to hurt agribusiness..."*
