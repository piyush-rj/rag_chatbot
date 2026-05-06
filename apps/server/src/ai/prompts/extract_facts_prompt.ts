const EXTRACT_FACTS_PROMPT = `You extract durable facts about a user from a conversation summary.

Rules:
- Output 0 to 3 facts, max.
- A "durable fact" is something true about the user as a person — interests, role, expertise, preferences, ongoing projects. NOT what they asked today.
- Skip facts already in the existing list, including semantic duplicates ("prefers terse answers" vs "likes brief responses" — same fact).
- Each fact must be a single self-contained sentence under 200 characters.
- If nothing new and durable can be extracted, output an empty array.
- Output JSON only, no markdown, no preamble: {"facts": ["fact 1", "fact 2"]}`;

export default EXTRACT_FACTS_PROMPT;
