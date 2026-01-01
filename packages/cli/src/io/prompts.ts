import path from "node:path";

export function buildClaudePrompt(args: {
  ticketId: string;
  ticketMd: string;
  refs: string[];
}) {
  const { ticketId, ticketMd, refs } = args;

  return [
    `# ORCHESTRATOR — CLAUDE BUILDER PROMPT`,
    ``,
    `Ticket ID: ${ticketId}`,
    ``,
    `ROLE: You are the BUILDER. Implement the ticket exactly.`,
    `- Obey scope, files-touched, verification steps, and stop condition.`,
    `- Do not refactor outside scope.`,
    `- Work inside the repo where the ticket lives (the current working repo).`,
    `- Only modify files listed under Files touched.`,
    `- If a path is ambiguous, STOP and ask for clarification.`,
    ``,
    `## Required references`,
    ...refs.map((r) => `- ${r}`),
    ``,
    `---`,
    `## Ticket`,
    ticketMd,
    ``,
    `---`,
    `## Output format`,
    `1) Plan`,
    `2) Exact commands + edits`,
    `3) Verification output`,
    `4) STOP`,
    ``,
  ].join("\n");
}

export function buildCodexPrompt(args: {
  ticketId: string;
  ticketMd: string;
  refs: string[];
}) {
  const { ticketId, ticketMd, refs } = args;

  return [
    `# ORCHESTRATOR — CODEX REVIEWER PROMPT`,
    ``,
    `Ticket ID: ${ticketId}`,
    ``,
    `ROLE: You are the REVIEWER + PLANNER (Codex).`,
    `You must output ONLY ONE of:`,
    `- VERDICT: APPROVED`,
    `- VERDICT: BLOCKED (list exact issues + violated rule/doc)`,
    `- VERDICT: ESCALATE (include payload)`,
    ``,
    `## Reference documents (for context)`,
    `These files exist in the client repo. Items marked "(optional)" or "(may be placeholder)" are not required for approval.`,
    ...refs.map((r) => `- ${r}`),
    ``,
    `**IMPORTANT:** Do NOT block a ticket solely because a reference file is empty or marked optional.`,
    `Only block if the ticket's acceptance criteria, verification steps, or scope are violated.`,
    ``,
    `---`,
    `## Ticket`,
    ticketMd,
    ``,
    `---`,
    `## Review rubric`,
    `- Files touched match ticket scope`,
    `- No extra modifications outside scope`,
    `- Acceptance criteria verified (based on builder output and evidence)`,
    `- Stop condition respected`,
    `- Analysis-only tickets (Files Touched: None) require NO file changes`,
    ``,
  ].join("\n");
}

// Centralize reference paths (relative strings; caller can render as needed)
// These paths are relative to the CLIENT repo root (e.g., /Users/mac/Sites/social)
// where orchestrator is installed as a git submodule at /orchestration.
export function getDefaultRefs() {
  return [
    `AI_RUNBOOK.md (optional; may be empty or absent)`,
    `orchestration/contracts/ticket.contract.md`,
    `orchestration/policies/human_interrupt_rules.md`,
    `orchestration/clients/social/plan.lock.json (may be placeholder)`,
    `orchestration/clients/social/schema.truth_table.md (may be placeholder)`,
  ];
}

export function safeTicketIdFromPath(ticketAbsPath: string) {
  return path.basename(ticketAbsPath, path.extname(ticketAbsPath));
}
