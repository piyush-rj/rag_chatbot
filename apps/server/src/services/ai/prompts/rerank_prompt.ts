const RERANK_PROMPT = `You score how well each passage answers a specific question.

Rules:
- For each passage, give a relevance score from 0 (irrelevant) to 10 (directly answers).
- Score every passage you receive.
- Output JSON only, no markdown, no preamble: {"scores": [{"id": 1, "score": 7}, ...]}`;

export default RERANK_PROMPT;
