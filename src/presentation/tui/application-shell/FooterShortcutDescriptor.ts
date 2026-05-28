export interface FooterShortcutDescriptor {
  readonly char: string;
}

export interface FooterContextualShortcutDescriptor extends FooterShortcutDescriptor {
  readonly label: string;
}

export const FooterShortcut = {
  QUIT: {
    char: "q",
    label: "quit",
  },
  NOTIFICATIONS: {
    char: "n",
  },
} as const satisfies Record<string, FooterShortcutDescriptor | FooterContextualShortcutDescriptor>;
