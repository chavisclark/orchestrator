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
    `## Required references`,
    ...refs.map((r) => `- ${r}`),
    ``,
    `---`,
    `## Ticket`,
    ticketMd,
    ``,
    `---`,
    `## Review rubric`,
    `- Files touched match ticket`,
    `- No extra modifications`,
    `- Acceptance criteria verified`,
    `- Stop condition respected`,
    ``,
  ].join("\n");
}

// Centralize reference paths (relative strings; caller can render as needed)
export function getDefaultRefs() {
  return [
    `AI_RUNBOOK.md`,
    `orchestration/contracts/ticket.contract.md`,
    `orchestration/policies/human_interrupt_rules.md`,
    `orchestration/clients/social/plan.lock.json`,
    `orchestration/clients/social/schema.truth_table.md`,
  ];
}

export function safeTicketIdFromPath(ticketAbsPath: string) {
  return path.basename(ticketAbsPath, path.extname(ticketAbsPath));
}
