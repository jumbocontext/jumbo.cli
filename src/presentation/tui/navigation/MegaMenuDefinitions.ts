import type { ScreenKey } from "./ScreenDefinitions.js";

export interface MegaMenuItem {
  readonly key: string;
  readonly label: string;
  readonly screenKey?: ScreenKey;
  readonly children?: readonly MegaMenuItem[];
}

export interface MegaMenuSection {
  readonly key: string;
  readonly label: string;
  readonly screenKey?: ScreenKey;
  readonly shortcut: string;
  readonly children: readonly MegaMenuItem[];
}

export const MEGA_MENU_SECTIONS: readonly MegaMenuSection[] = [
  {
    key: "cockpit",
    label: "Cockpit",
    screenKey: "cockpit",
    shortcut: "1",
    children: [
      {
        key: "project-overview",
        label: "Project Overview",
        children: [
          { key: "name", label: "Name" },
          { key: "purpose", label: "Purpose" },
          { key: "audiences", label: "Audiences" },
        ],
      },
      {
        key: "goal-summary",
        label: "Goal Summary",
        children: [
          { key: "in-progress", label: "In Progress" },
          { key: "blocked", label: "Blocked" },
          { key: "completed", label: "Completed" },
        ],
      },
      {
        key: "recent-events",
        label: "Recent Events",
        children: [
          { key: "decisions", label: "Decisions" },
          { key: "components", label: "Components" },
          { key: "sessions", label: "Sessions" },
        ],
      },
    ],
  },
  {
    key: "goals",
    label: "Goals",
    screenKey: "goals",
    shortcut: "2",
    children: [
      {
        key: "backlog",
        label: "Backlog",
        children: [
          { key: "defined", label: "Defined" },
          { key: "refined", label: "Refined" },
          { key: "ready", label: "Ready" },
        ],
      },
      {
        key: "active",
        label: "Active",
        children: [
          { key: "in-progress", label: "In Progress" },
          { key: "blocked", label: "Blocked" },
          { key: "in-review", label: "In Review" },
        ],
      },
      {
        key: "archive",
        label: "Archive",
        children: [
          { key: "completed", label: "Completed" },
          { key: "removed", label: "Removed" },
        ],
      },
    ],
  },
  {
    key: "memory",
    label: "Memory",
    shortcut: "3",
    children: [
      {
        key: "decisions",
        label: "Decisions",
        screenKey: "decisions",
        children: [
          { key: "active", label: "Active" },
          { key: "superseded", label: "Superseded" },
          { key: "reversed", label: "Reversed" },
        ],
      },
      {
        key: "invariants",
        label: "Invariants",
        screenKey: "invariants",
        children: [
          { key: "architecture", label: "Architecture" },
          { key: "process", label: "Process" },
          { key: "testing", label: "Testing" },
        ],
      },
      {
        key: "components",
        label: "Components",
        screenKey: "components",
        children: [
          { key: "services", label: "Services" },
          { key: "ui", label: "UI" },
          { key: "libraries", label: "Libraries" },
        ],
      },
      {
        key: "dependencies",
        label: "Dependencies",
        screenKey: "dependencies",
        children: [
          { key: "runtime", label: "Runtime" },
          { key: "dev", label: "Dev" },
        ],
      },
      {
        key: "guidelines",
        label: "Guidelines",
        screenKey: "guidelines",
        children: [
          { key: "coding-style", label: "Coding Style" },
          { key: "testing", label: "Testing" },
          { key: "process", label: "Process" },
        ],
      },
    ],
  },
  {
    key: "session",
    label: "Session",
    screenKey: "session",
    shortcut: "4",
    children: [
      {
        key: "current",
        label: "Current",
        children: [
          { key: "focus", label: "Focus" },
          { key: "commands", label: "Commands" },
          { key: "progress", label: "Progress" },
        ],
      },
      {
        key: "history",
        label: "History",
        children: [
          { key: "recent", label: "Recent" },
          { key: "all", label: "All" },
        ],
      },
      {
        key: "notifications",
        label: "Notifications",
        children: [
          { key: "unread", label: "Unread" },
          { key: "dismissed", label: "Dismissed" },
        ],
      },
    ],
  },
] as const;

export const MAX_MENU_DEPTH = 3;
