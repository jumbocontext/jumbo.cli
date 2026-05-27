import { BaseColors } from "../../shared/DesignTokens.js";

export const FooterShortcut = {
  QUIT: {
    char: "q",
    label: "quit",
  },
  NOTIFICATIONS: {
    char: "n",
  },
} as const;

export const FooterCopy = {
  notifications: "notifications",
} as const;

export const NOTIFICATION_NOTIFIER_COLOR = BaseColors.brandYellow;
