import { useCallback, useState } from "react";

export interface FooterNotificationDismissalResult {
  readonly dismissedNotificationIds: readonly string[];
  readonly handleDismissNotification: (notificationId: string) => void;
}

export function useFooterNotificationDismissal(): FooterNotificationDismissalResult {
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<
    readonly string[]
  >([]);

  const handleDismissNotification = useCallback((notificationId: string) => {
    setDismissedNotificationIds((previous) => [...previous, notificationId]);
  }, []);

  return { dismissedNotificationIds, handleDismissNotification };
}
