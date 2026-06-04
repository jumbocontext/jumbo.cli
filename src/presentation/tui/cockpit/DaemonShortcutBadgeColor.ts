import { BaseColors } from "../../shared/DesignTokens.js";

export function getDaemonShortcutBadgeColor(selected: boolean): string {
  return selected ? BaseColors.brandBlue : BaseColors.shade4;
}
