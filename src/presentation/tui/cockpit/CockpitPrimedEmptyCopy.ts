export const CockpitPrimedEmptyCopy = {
  intro: "Project memory is stored. Ready to create your first goal.",
  addGoalPrompt: {
    keyChar: "g",
    prefix: "Press ",
    suffix: " to add a goal",
    secondary: "or run 'jumbo goal add' from another terminal",
  },
  primerHeading: "A PRIMER ON GOALS",
  primerParagraphs: [
    "With Jumbo, you define work as goals, not open-ended agent prompts. A goal is the unit of work: an objective, success criteria, and scope.",
    "Goals give project memory a single object to organize around. When an agent starts the goal with the Jumbo CLI, Jumbo returns focused project knowledge and workflow instructions for that goal.",
    "New memories are captured only through explicit Jumbo commands run by the agent or by you as corrections, decisions, and discoveries arise during the work.",
  ],
} as const;
