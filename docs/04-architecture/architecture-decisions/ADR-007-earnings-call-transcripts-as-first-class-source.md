# ADR-007: Earnings Call Transcripts as a First-Class RAG Source

* **Status**: Accepted
* **Date**: September 2026

## Context
Most generic financial chatbots treat all text documents as undifferentiated blobs of strings. However, equity analysts derive their highest-conviction insights from **quarterly earnings conference calls**. Transcripts contain dynamic discussions where management is forced to explain margin deterioration, segment headwinds, supply chain friction, and future capital expenditures in response to tough questions from Wall Street/Dalal Street analysts.

If an AI treats transcript dialogue without speaker structure:
1. It might mistake a skeptical analyst's hypothetical question (*"Are your cigarette volumes dropping by 5%?"*) as an official management disclosure.
2. It might present management's optimistic guidance as a verified historical fact.

## Decision
We chose to treat **earnings conference call transcripts as first-class citizens** with specialized metadata parsing, chunking, and attribution.

## Rationale
1. **Preservation of Speaker Context**: Every chunk retains `speaker_name`, `speaker_role` (e.g., Chairman, CFO), `organization` (e.g., Company Executive vs Sell-side Analyst), and `section` (`prepared_remarks` vs `q_and_a`).
2. **Attribution Accuracy**: Enables prompt instructions like: *"When citing management remarks, use explicit attribution ('CFO noted that...'). When citing analyst questions, clarify that it was an analyst inquiry."*
3. **High Signal-to-Noise Ratio**: Directly addresses the "Why" questions that balance sheets and income statements cannot answer on their own.

## Consequences
* **Positive**: Tremendous domain-specific intelligence and realism; eliminates speaker confusion hallucinations.
* **Negative**: Requires a custom regex/heuristic parser during transcript ingestion to accurately detect speaker switches and designations.
