export const SessionInstructionSignal = {
  BROWNFIELD_ONBOARDING: "brownfield-onboarding",
  PRIMITIVE_GAPS_DETECTED: "primitive-gaps-detected",
  PAUSED_GOALS_RESUME: "paused-goals-resume",
  GOAL_SELECTION_PROMPT: "goal-selection-prompt",
} as const;

export type SessionInstructionSignalValue =
  typeof SessionInstructionSignal[keyof typeof SessionInstructionSignal];
