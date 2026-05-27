import type { IDaemonConstants } from "./IDaemonConstants.js";

export const RefinerDaemonConstants = {
  name: "refiner",
  title: "REFINER//",
  activeVerb: "refining",
  idleVerb: "foraging",
  info: {
    title: "REFINER//",
    lines: [
      "Automatically apply relevant memories to build goal context for the implementing agent.",
      "",
      "Goals are submitted when finished and ready for implementation.",
    ],
  },
} as const satisfies IDaemonConstants;
