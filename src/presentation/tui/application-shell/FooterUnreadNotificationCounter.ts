import type { NotificationDrawerNotification } from "./NotificationDrawer.js";

export function FooterUnreadNotificationCounter(
  notifications: readonly NotificationDrawerNotification[],
): number {
  return notifications.filter((notification) => notification.unread).length;
}
