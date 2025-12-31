# Ticket Contract (Orchestrator)

A ticket is the smallest unit of work. Claude may execute ONE ticket per run.

## Required Fields
- Ticket ID:
- Title:
- Scope (1–5 bullets):
- Files touched (paths):
- Non-goals (explicit):
- Acceptance Criteria (testable):
- Verification Steps (commands + manual checks):
- Stop Condition:
  - Must stop after completing this ticket
  - Must not start the next ticket

## Execution Rules
- Use only strings/enums from: clients/social/schema.truth_table.md
- Must obey: clients/social/plan.lock.json
- No schema changes unless plan.lock allows it
- No refactors outside scope
- If blocked, return a BLOCKED report with:
  - reason
  - what was tried
  - next safe options (2–3)

