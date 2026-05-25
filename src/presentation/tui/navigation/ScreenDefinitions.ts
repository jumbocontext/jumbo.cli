export const SCREEN_DEFINITIONS = [
  { key: "cockpit", label: "Cockpit", shortcut: "1" },
  { key: "goals", label: "Goals", shortcut: "2" },
  { key: "decisions", label: "Decisions", shortcut: "3" },
  { key: "invariants", label: "Invariants", shortcut: "4" },
  { key: "components", label: "Components", shortcut: "5" },
  { key: "dependencies", label: "Dependencies", shortcut: "6" },
  { key: "guidelines", label: "Guidelines", shortcut: "7" },
  { key: "session", label: "Session", shortcut: "8" },
] as const;

export type ScreenKey = (typeof SCREEN_DEFINITIONS)[number]["key"];

export const DEFAULT_SCREEN_INDEX = 0;
