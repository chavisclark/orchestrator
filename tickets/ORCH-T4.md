# Ticket ID: ORCH-T4
Title: Add `orchestrator exec` command with Claude + Codex automation

## Scope
- Add new `exec` command that eliminates manual copy/paste between Builder (Claude) and Reviewer (Codex)
- Integrate Anthropic API for Claude builder (with streaming output)
- Integrate OpenAI API for Codex reviewer
- Write all execution artifacts to run directory (claude.output.md, codex.verdict.txt, exec.log)
- Use exit codes to indicate verdict: 0=APPROVED, 1=BLOCKED, 2=ESCALATE, 3=ERROR

## Files touched
- packages/cli/src/index.ts (modify - add exec command)
- packages/cli/src/ai/anthropic.ts (create)
- packages/cli/src/ai/openai.ts (create)
- packages/cli/src/exec/executor.ts (create)
- packages/cli/package.json (modify - add @anthropic-ai/sdk and openai dependencies)

## Non-goals
- No auto-retry logic on BLOCKED verdict
- No refactors outside exec command implementation
- Do not break existing `run` command behavior
- No webhook notifications (reserved for ORCH-T5)

## Acceptance Criteria
- `orchestrator exec tickets/PILOT-T1.md` generates run pack if not exists
- Calls Claude API with claude.prompt.txt, streams output to terminal and saves to claude.output.md
- Regenerates review.packet.md to include builder output
- Calls OpenAI API (Codex) with codex.prompt.txt + review.packet.md
- Writes normalized verdict to codex.verdict.txt (APPROVED/BLOCKED/ESCALATE)
- Writes execution log to exec.log with timestamps and sanitized errors
- Exit codes: 0=APPROVED, 1=BLOCKED, 2=ESCALATE, 3=ERROR
- Fails fast with clear message if ANTHROPIC_API_KEY or OPENAI_API_KEY missing
- Graceful error handling for API failures, rate limits, network issues
- No auto-retry on BLOCKED verdict
- Preserves all existing run pack files (review.packet.md, run.md, etc.)

## Environment Variables
Required:
- ANTHROPIC_API_KEY
- OPENAI_API_KEY

Optional (with defaults):
- ANTHROPIC_MODEL (default: claude-sonnet-4-20250514)
- OPENAI_MODEL (default: gpt-4o)

## Verification Steps
From /Users/mac/Sites/social (after submodule update):
```bash
# Set required env vars
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...

# Run exec command
node orchestration/packages/cli/dist/index.js exec tickets/PILOT-T1.md

# Verify artifacts created
ls -la orchestration/audit/runs/PILOT-T1/claude.output.md
ls -la orchestration/audit/runs/PILOT-T1/codex.verdict.txt
ls -la orchestration/audit/runs/PILOT-T1/exec.log

# Check exit code matches verdict
echo $?

# Verify streaming output was visible during execution
# Verify exec.log contains timestamps and major steps
cat orchestration/audit/runs/PILOT-T1/exec.log

# Verify verdict is normalized
cat orchestration/audit/runs/PILOT-T1/codex.verdict.txt
```

## Stop Condition
Stop after verification confirms exec command works end-to-end with proper exit codes and artifact generation.
