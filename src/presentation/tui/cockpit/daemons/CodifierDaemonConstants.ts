import type { IDaemonConstants } from "./IDaemonConstants.js";

export const CodifierDaemonConstants = {
  name: "codifier",
  title: "CODIFIER//",
  activeVerb: "codifying",
  idleVerb: "awaiting approvals",
  info: {
    title: "CODIFIER//",
    lines: [
      "Codify implementation results automatically as soon as goals are approved.",
      "",
      "Missing decisions, components and documentation will be updated before goals are finally closed.",
    ],
  },
} as const satisfies IDaemonConstants;
