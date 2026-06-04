/**
 * Strips common ISB verb prefixes so queries like "open How to sell ideas"
 * become searchable titles ("How to sell ideas").
 */
export function stripCommandIntentPrefixes(raw: string): string {
  let s = raw.trim();
  s = s.replace(
    /^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:i\s+want\s+to\s+)?(?:help\s+me\s+)?(?:i\s+need\s+to\s+)?/i,
    ""
  );
  s = s.replace(
    /^(?:open|show|view|launch|display|edit|find|search\s+for|go\s+to|navigate\s+to|take\s+me\s+to|jump\s+to)\s*:?\s*/i,
    ""
  );
  s = s.replace(/^(?:last|latest|recent|newest)\s+/i, "");
  s = s.replace(/^(?:the|a|an)\s+/i, "");
  s = s.replace(/^(?:blog\s+post|blog\s+posts|post|posts|article)\s+/i, "");
  return s.trim();
}
