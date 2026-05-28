import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { BaseColors, TuiGlyphs } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import { NotificationDrawer } from "./NotificationDrawer.js";
import type { NotificationDrawerNotification } from "./NotificationDrawer.js";
import {
  FooterShortcut,
  type FooterContextualShortcutDescriptor,
} from "./FooterShortcutDescriptor.js";
import { FooterUnreadNotificationCounter } from "./FooterUnreadNotificationCounter.js";
import { useFooterNotificationDismissal } from "./useFooterNotificationDismissal.js";

const FOOTER_NOTIFICATION_COUNTER_COLOR = BaseColors.brandYellow;
const FOOTER_NOTIFICATION_COUNT_COPY = "notifications";

interface FooterProps {
  terminalWidth: number;
  shortcutsEnabled?: boolean;
  contextualShortcuts?: readonly FooterContextualShortcutDescriptor[];
  notifications?: readonly NotificationDrawerNotification[];
}

export function Footer({
  terminalWidth,
  shortcutsEnabled = true,
  contextualShortcuts = [],
  notifications = [],
}: FooterProps): React.ReactElement {
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const { dismissedNotificationIds, handleDismissNotification } =
    useFooterNotificationDismissal();

  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => !dismissedNotificationIds.includes(notification.id),
      ),
    [notifications, dismissedNotificationIds],
  );
  const unreadNotificationCount = FooterUnreadNotificationCounter(
    visibleNotifications,
  );

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
            <Text color={FOOTER_NOTIFICATION_COUNTER_COLOR}>
              {TuiGlyphs.filledCircle} {FOOTER_NOTIFICATION_COUNT_COPY} (
              {unreadNotificationCount})
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
