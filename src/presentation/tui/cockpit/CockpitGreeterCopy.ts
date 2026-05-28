export const CockpitGreeterCopy = {
  body: [
    "Hi, I'm Jumbo. I help coding agents stay aligned with your project intent.",
    "I capture the decisions, rules, corrections, and goals that matter, then deliver the relevant context back to agents when they need it. That keeps work consistent across sessions and agents without forcing you to rebuild context every time.",
    "Get started by initializing this project.",
  ],
  initializePrompt: {
    keyChar: "i",
    prefix: "Press ",
    suffix: " to initialize",
    secondary: "or run 'jumbo init' from another terminal",
  },
} as const;
