import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { BaseColors, TuiGlyphs } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import { NotificationDrawer } from "./NotificationDrawer.js";
import type { NotificationDrawerNotification } from "./NotificationDrawer.js";

interface FooterProps {
  terminalWidth: number;
  shortcutsEnabled?: boolean;
  contextualShortcuts?: readonly FooterShortcut[];
  notifications?: readonly NotificationDrawerNotification[];
}

interface FooterShortcut {
  readonly char: string;
  readonly label: string;
}

export const NOTIFICATION_NOTIFIER_COLOR = BaseColors.brandYellow;

export function Footer({
  terminalWidth,
  shortcutsEnabled = true,
  contextualShortcuts = [],
  notifications = [],
}: FooterProps): React.ReactElement {
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<
    readonly string[]
  >([]);

  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => !dismissedNotificationIds.includes(notification.id),
      ),
    [dismissedNotificationIds, notifications],
  );
  const unreadNotificationCount = visibleNotifications.filter(
    (notification) => notification.unread,
  ).length;

  useInput((input) => {
    if (!shortcutsEnabled) {
      return;
    }

    if (input === "n" || input === "N") {
      setNotificationDrawerOpen((isOpen) => !isOpen);
    }
  });

  const handleDismissNotification = (id: string) => {
    setDismissedNotificationIds((previous) => [...previous, id]);
  };

  return (
    <Box flexDirection="column" width={terminalWidth}>
      {notificationDrawerOpen && (
        <NotificationDrawer
          notifications={visibleNotifications}
          onDismiss={handleDismissNotification}
          onClose={() => setNotificationDrawerOpen(false)}
          terminalWidth={terminalWidth}
        />
      )}
      <Box justifyContent="space-between" paddingX={1}>
        <Box gap={2}>
          <KeyBadge char="q" label="quit" />
          {contextualShortcuts.map((shortcut) => (
            <KeyBadge
              key={`${shortcut.char}-${shortcut.label}`}
              char={shortcut.char}
              label={shortcut.label}
            />
          ))}
        </Box>
        {unreadNotificationCount > 0 && (
          <Box alignItems="center" gap={1}>
            <KeyBadge char="n" />
            <Text color={NOTIFICATION_NOTIFIER_COLOR}>
              {TuiGlyphs.filledCircle} notifications ({unreadNotificationCount})
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
