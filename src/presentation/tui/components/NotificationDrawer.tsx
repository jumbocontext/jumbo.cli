import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { BaseColors, SemanticColors, TuiGlyphs } from "../../shared/DesignTokens.js";

export interface NotificationDrawerNotification {
  id: string;
  title: string;
  body: string;
  unread: boolean;
}

interface NotificationDrawerProps {
  notifications: readonly NotificationDrawerNotification[];
  onDismiss: (id: string) => void;
  onClose: () => void;
  terminalWidth: number;
}

export function NotificationDrawer({
  notifications,
  onDismiss,
  onClose,
  terminalWidth,
}: NotificationDrawerProps): React.ReactElement {
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    if (highlightedIndex > notifications.length - 1) {
      setHighlightedIndex(Math.max(notifications.length - 1, 0));
    }
  }, [highlightedIndex, notifications.length]);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.upArrow) {
      setHighlightedIndex((previous) => Math.max(previous - 1, 0));
      return;
    }

    if (key.downArrow) {
      setHighlightedIndex((previous) =>
        Math.min(previous + 1, Math.max(notifications.length - 1, 0)),
      );
      return;
    }

    if ((input === "d" || input === "D") && notifications[highlightedIndex]) {
      onDismiss(notifications[highlightedIndex].id);
    }
  });

  return (
    <Box
      flexDirection="column"
      width={terminalWidth}
      borderStyle="single"
      borderColor={SemanticColors.muted}
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text color={SemanticColors.headline} bold>
          Notifications
        </Text>
      </Box>
      <Box flexDirection="column">
        {notifications.length === 0 ? (
          <Text color={SemanticColors.muted}>No notifications</Text>
        ) : (
          notifications.map((notification, index) => {
            const isHighlighted = index === highlightedIndex;
            const marker = notification.unread
              ? TuiGlyphs.filledCircle
              : TuiGlyphs.dot;

            return (
              <Box key={notification.id} flexDirection="column" marginBottom={1}>
                <Text
                  color={
                    isHighlighted
                      ? BaseColors.brandBlue
                      : SemanticColors.primary
                  }
                  bold={isHighlighted}
                >
                  {isHighlighted ? TuiGlyphs.selector : " "} {marker}{" "}
                  {notification.title}
                </Text>
                <Box marginLeft={4}>
                  <Text color={SemanticColors.muted}>{notification.body}</Text>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
      <Box marginTop={1}>
        <Text color={SemanticColors.muted}>
          ↑↓ select {TuiGlyphs.dot} d dismiss {TuiGlyphs.dot} esc close
        </Text>
      </Box>
    </Box>
  );
}
