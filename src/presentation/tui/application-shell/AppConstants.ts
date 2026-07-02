export const AppCopy = {
  placeholderProjectName: "Jumbo",
  goalAuthoringUnavailable:
    "Goal registration is unavailable. Restart Jumbo and try again.",
  daemonFailureBody: "The daemon process exited with a failure status.",
} as const;

export const AppShortcut = {
  SEARCH: {
    char: "/",
    label: "search",
  },
  TOGGLE_WORKER: {
    char: "tab",
    label: "toggle worker",
  },
  CREATE_GOAL: {
    char: "g",
    label: "create goal",
  },
} as const;

export const FRAME_CHROME_ROWS = 2;
export const TERMINAL_RESIZE_EVENT = "resize";
