import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { SemanticColors, TuiGlyphs } from "../../shared/DesignTokens.js";
import { KeyBadge } from "./KeyBadge.js";
import { NotificationDrawer } from "./NotificationDrawer.js";
import type { NotificationDrawerNotification } from "./NotificationDrawer.js";

interface FooterProps {
  terminalWidth: number;
}

const PLACEHOLDER_NOTIFICATIONS: readonly NotificationDrawerNotification[] = [
  {
    id: "version-check",
    title: "New CLI version available",
    body: "A placeholder update notice will connect to version checks later.",
    unread: true,
  },
  {
    id: "daemon-health",
    title: "Daemon failure detected",
    body: "A placeholder daemon alert will connect to process events later.",
    unread: true,
  },
  {
    id: "missed-summary",
    title: "What you missed",
    body: "A placeholder session summary will connect to recent events later.",
    unread: true,
  },
];

export function Footer({ terminalWidth }: FooterProps): React.ReactElement {
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<
    readonly string[]
  >([]);

  const visibleNotifications = useMemo(
    () =>
      PLACEHOLDER_NOTIFICATIONS.filter(
        (notification) => !dismissedNotificationIds.includes(notification.id),
      ),
    [dismissedNotificationIds],
  );
  const unreadNotificationCount = visibleNotifications.filter(
    (notification) => notification.unread,
  ).length;

  useInput((input) => {
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
      {/* <Text color={SemanticColors.muted} dimColor>
        {TuiGlyphs.divider.repeat(terminalWidth)}
      </Text> */}
      <Box justifyContent="space-between" paddingX={1}>
        <Box gap={2}>
          <KeyBadge char="m" label="menu" />
          <KeyBadge
            char="n"
            label={`notifications (${unreadNotificationCount})`}
          />
          <KeyBadge char="q" label="quit" />
          <KeyBadge char="h" label="help" />
        </Box>
        <Box alignItems="center">
          <Text color={SemanticColors.muted}>
            {TuiGlyphs.filledCircle} daemons: idle
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
