import type { ScreenKey } from "./ScreenDefinitions.js";
import { GoalStatus } from "../../../domain/goals/Constants.js";
import { DecisionStatus } from "../../../domain/decisions/Constants.js";
import { GuidelineCategory } from "../../../domain/guidelines/Constants.js";
import { ComponentType } from "../../../domain/components/Constants.js";

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

const MEGA_MENU_PRESENTATION_KEYS = {
  cockpit: "cockpit",
  projectOverview: "project-overview",
  name: "name",
  purpose: "purpose",
  audiences: "audiences",
  goalSummary: "goal-summary",
  recentEvents: "recent-events",
  decisions: "decisions",
  components: "components",
  sessions: "sessions",
  goals: "goals",
  backlog: "backlog",
  ready: "ready",
  active: "active",
  archive: "archive",
  removed: "removed",
  memory: "memory",
  invariants: "invariants",
  invariantArchitecture: "architecture",
  invariantProcess: "process",
  invariantTesting: "testing",
  dependencies: "dependencies",
  runtime: "runtime",
  dev: "dev",
  guidelines: "guidelines",
  session: "session",
  current: "current",
  focus: "focus",
  commands: "commands",
  progress: "progress",
  history: "history",
  recent: "recent",
  all: "all",
  notifications: "notifications",
  unread: "unread",
  dismissed: "dismissed",
} as const;

export const MEGA_MENU_SECTIONS: readonly MegaMenuSection[] = [
  {
    key: MEGA_MENU_PRESENTATION_KEYS.cockpit,
    label: "Cockpit",
    screenKey: "cockpit",
    shortcut: "1",
    children: [
      {
        key: MEGA_MENU_PRESENTATION_KEYS.projectOverview,
        label: "Project Overview",
        children: [
          { key: MEGA_MENU_PRESENTATION_KEYS.name, label: "Name" },
          { key: MEGA_MENU_PRESENTATION_KEYS.purpose, label: "Purpose" },
          { key: MEGA_MENU_PRESENTATION_KEYS.audiences, label: "Audiences" },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.goalSummary,
        label: "Goal Summary",
        children: [
          { key: GoalStatus.DOING, label: "In Progress" },
          { key: GoalStatus.BLOCKED, label: "Blocked" },
          { key: GoalStatus.DONE, label: "Completed" },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.recentEvents,
        label: "Recent Events",
        children: [
          { key: MEGA_MENU_PRESENTATION_KEYS.decisions, label: "Decisions" },
          { key: MEGA_MENU_PRESENTATION_KEYS.components, label: "Components" },
          { key: MEGA_MENU_PRESENTATION_KEYS.sessions, label: "Sessions" },
        ],
      },
    ],
  },
  {
    key: MEGA_MENU_PRESENTATION_KEYS.goals,
    label: "Goals",
    screenKey: "goals",
    shortcut: "2",
    children: [
      {
        key: MEGA_MENU_PRESENTATION_KEYS.backlog,
        label: "Backlog",
        children: [
          { key: GoalStatus.TODO, label: "Defined" },
          { key: GoalStatus.REFINED, label: "Refined" },
          { key: MEGA_MENU_PRESENTATION_KEYS.ready, label: "Ready" },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.active,
        label: "Active",
        children: [
          { key: GoalStatus.DOING, label: "In Progress" },
          { key: GoalStatus.BLOCKED, label: "Blocked" },
          { key: GoalStatus.INREVIEW, label: "In Review" },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.archive,
        label: "Archive",
        children: [
          { key: GoalStatus.DONE, label: "Completed" },
          { key: MEGA_MENU_PRESENTATION_KEYS.removed, label: "Removed" },
        ],
      },
    ],
  },
  {
    key: MEGA_MENU_PRESENTATION_KEYS.memory,
    label: "Memory",
    shortcut: "3",
    children: [
      {
        key: MEGA_MENU_PRESENTATION_KEYS.decisions,
        label: "Decisions",
        screenKey: "decisions",
        children: [
          { key: DecisionStatus.ACTIVE, label: "Active" },
          { key: DecisionStatus.SUPERSEDED, label: "Superseded" },
          { key: DecisionStatus.REVERSED, label: "Reversed" },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.invariants,
        label: "Invariants",
        screenKey: "invariants",
        children: [
          {
            key: MEGA_MENU_PRESENTATION_KEYS.invariantArchitecture,
            label: "Architecture",
          },
          { key: MEGA_MENU_PRESENTATION_KEYS.invariantProcess, label: "Process" },
          { key: MEGA_MENU_PRESENTATION_KEYS.invariantTesting, label: "Testing" },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.components,
        label: "Components",
        screenKey: "components",
        children: [
          { key: ComponentType.SERVICE, label: "Services" },
          { key: ComponentType.UI, label: "UI" },
          { key: ComponentType.LIB, label: "Libraries" },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.dependencies,
        label: "Dependencies",
        screenKey: "dependencies",
        children: [
          { key: MEGA_MENU_PRESENTATION_KEYS.runtime, label: "Runtime" },
          { key: MEGA_MENU_PRESENTATION_KEYS.dev, label: "Dev" },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.guidelines,
        label: "Guidelines",
        screenKey: "guidelines",
        children: [
          { key: GuidelineCategory.CODING_STYLE, label: "Coding Style" },
          { key: GuidelineCategory.TESTING, label: "Testing" },
          { key: GuidelineCategory.PROCESS, label: "Process" },
        ],
      },
    ],
  },
  {
    key: MEGA_MENU_PRESENTATION_KEYS.session,
    label: "Session",
    screenKey: "session",
    shortcut: "4",
    children: [
      {
        key: MEGA_MENU_PRESENTATION_KEYS.current,
        label: "Current",
        children: [
          { key: MEGA_MENU_PRESENTATION_KEYS.focus, label: "Focus" },
          { key: MEGA_MENU_PRESENTATION_KEYS.commands, label: "Commands" },
          { key: MEGA_MENU_PRESENTATION_KEYS.progress, label: "Progress" },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.history,
        label: "History",
        children: [
          { key: MEGA_MENU_PRESENTATION_KEYS.recent, label: "Recent" },
          { key: MEGA_MENU_PRESENTATION_KEYS.all, label: "All" },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.notifications,
        label: "Notifications",
        children: [
          { key: MEGA_MENU_PRESENTATION_KEYS.unread, label: "Unread" },
          { key: MEGA_MENU_PRESENTATION_KEYS.dismissed, label: "Dismissed" },
        ],
      },
    ],
  },
] as const;

export const MAX_MENU_DEPTH = 3;
