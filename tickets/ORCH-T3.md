# Ticket ID: ORCH-T3
Title: Generate automatic review.packet.md with git evidence

## Scope
- Update CLI `run` command to generate review.packet.md automatically
- Detect ticket repo root and execute git commands from correct working directory
- Embed ticket content, prompts, git status, git diff, and builder output in review packet
- Handle empty git diff by including git log fallback evidence

## Files touched
- packages/cli/src/commands/run.ts (modify)
- packages/cli/src/utils/git-evidence.ts (create)
- packages/cli/src/utils/repo-root.ts (create)

## Non-goals
- No changes to review logic
- No changes to ticket contract
- No refactors outside CLI evidence capture

## Acceptance Criteria
- CLI creates review.packet.md in orchestration/audit/runs/<ticketId>/
- review.packet.md includes:
  - Ticket content
  - Claude prompt content
  - Codex prompt content
  - Local Evidence section with git status, git diff
  - If git diff empty: git log -n 5, git log for touched files, git show HEAD
  - Builder Output section (embedded if claude.output.md exists, placeholder if not)
- Git commands execute from ticket repo root (not CLI's cwd)
- Works when run from /Users/mac/Sites/social referencing submodule CLI
- ESM imports use .js extensions

## Verification Steps
From /Users/mac/Sites/social:
```bash
node orchestration/packages/cli/dist/index.js run tickets/PILOT-T1.md
ls -la orchestration/audit/runs/PILOT-T1/review.packet.md
sed -n '1,200p' orchestration/audit/runs/PILOT-T1/review.packet.md
```

Confirm review.packet.md contains all required sections.

## Stop Condition
Stop after verification confirms review.packet.md is generated with all required evidence sections.
