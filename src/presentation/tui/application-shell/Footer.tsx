import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { TuiGlyphs } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import { NotificationDrawer } from "./NotificationDrawer.js";
import type { NotificationDrawerNotification } from "./NotificationDrawer.js";
import {
  FooterCopy,
  FooterShortcut,
  NOTIFICATION_NOTIFIER_COLOR,
} from "./FooterConstants.js";

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

    if (
      input === FooterShortcut.NOTIFICATIONS.char ||
      input === FooterShortcut.NOTIFICATIONS.char.toUpperCase()
    ) {
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
          <KeyBadge
            char={FooterShortcut.QUIT.char}
            label={FooterShortcut.QUIT.label}
          />
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
            <KeyBadge char={FooterShortcut.NOTIFICATIONS.char} />
            <Text color={NOTIFICATION_NOTIFIER_COLOR}>
              {TuiGlyphs.filledCircle} {FooterCopy.notifications} ({unreadNotificationCount})
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
