# Ticket ID: ORCH-T2
Title: Generate run artifacts (prompts + run.md) for a ticket

## Scope
- Extend orchestrator CLI `run` command to:
  - Read the provided ticket markdown
  - Create run directory under `orchestration/audit/runs/<ticket-id>/`
  - Write:
    - ticket.md (copy of the ticket content)
    - claude.prompt.txt
    - codex.prompt.txt
    - run.md (single bundle containing ticket + prompts + placeholders)

## Files touched
- packages/cli/src/index.ts
- packages/cli/src/io/runpack.ts (new)
- packages/cli/src/io/prompts.ts (new)
- packages/cli/package.json (if needed for new imports only)
- packages/cli/tsconfig.json (only if required)

## Non-goals
- No API calls
- No audit log writes
- No verdict logic
- No changes to /social repo

## Acceptance Criteria
- Running from /social root:
  - `node orchestration/packages/cli/dist/index.js run tickets/PILOT-T1.md`
  creates:
  - `orchestration/audit/runs/PILOT-T1/ticket.md`
  - `orchestration/audit/runs/PILOT-T1/claude.prompt.txt`
  - `orchestration/audit/runs/PILOT-T1/codex.prompt.txt`
  - `orchestration/audit/runs/PILOT-T1/run.md`
- Prompts match the current `scripts/orch` output format and reference:
  - AI_RUNBOOK.md
  - orchestration/contracts/ticket.contract.md
  - orchestration/policies/human_interrupt_rules.md
  - orchestration/clients/social/plan.lock.json
  - orchestration/clients/social/schema.truth_table.md

## Verification Steps
- From /social:
  - rm -rf orchestration/audit/runs/PILOT-T1
  - node orchestration/packages/cli/dist/index.js run tickets/PILOT-T1.md
  - ls orchestration/audit/runs/PILOT-T1
  - cat orchestration/audit/runs/PILOT-T1/run.md | head -40
- Confirm file paths are correct and stable regardless of working directory

## Stop Condition
Stop after run artifacts are generated and verification passes.
Do not start ORCH-T3.
