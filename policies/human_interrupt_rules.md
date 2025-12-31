# Human Interrupt Rules (Social Client)

Claude/Codex may interrupt the human ONLY if one of these is true:

1) External service limitation or ambiguity
   - Airtable API limits / auth / schema mismatch
   - R2 permissions / signed URL issues
   - Perplexity/Gemini API quota or policy constraints
   - TikTok platform/policy uncertainty that affects implementation

2) Plan conflict with repo reality
   - Plan requires a pattern that does not exist and cannot be inferred safely

3) Schema ambiguity not resolvable from truth table
   - Field/table/enum mismatch and truth table does not clarify

4) Subjective judgment required
   - Editorial/brand decision, UX preference, naming decision

5) Repeated failure
   - Same test fails after 2 materially different fixes

## Escalation Payload (Required Format)

- Reason:
- Context:
- What was tried:
- Options (2–3):
- Recommendation:

