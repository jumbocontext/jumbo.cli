import type { IDaemonConstants } from "./IDaemonConstants.js";

export const ReviewerDaemonConstants = {
  name: "reviewer",
  title: "REVIEWER//",
  activeVerb: "reviewing",
  idleVerb: "awaiting submissions",
  info: {
    title: "REVIEWER//",
    lines: [
      "Orchestrate background agents to automatically review goal implementations as soon as they submitted.",
      "",
      "Approved goals will get picked up by the codifier (if running).",
      "Rejected goals will get requeued with documented issues to be resolved.",
    ],
  },
} as const satisfies IDaemonConstants;
