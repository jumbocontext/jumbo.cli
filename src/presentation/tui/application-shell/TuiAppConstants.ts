export const TuiAppCopy = {
  placeholderProjectName: "Jumbo",
  goalAuthoringUnavailable:
    "Goal registration is unavailable. Restart Jumbo and try again.",
  daemonFailureBody: "The daemon process exited with a failure status.",
} as const;

export const TuiAppShortcut = {
  TOGGLE_WORKER: {
    char: "tab",
    label: "toggle worker",
  },
  CREATE_GOAL: {
    char: "g",
    label: "create goal",
  },
} as const;

export const TUI_FRAME_CHROME_ROWS = 2;
export const TERMINAL_RESIZE_EVENT = "resize";
