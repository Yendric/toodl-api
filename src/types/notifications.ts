import type { Todo, User } from "#/generated/prisma/client.js";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

export type NotificationType = "daily" | "reminder" | "now";

export interface INotificationProvider {
  sendDaily(user: User, todos: Todo[]): Promise<void>;
  sendReminder(user: User, todo: Todo): Promise<void>;
  sendNow(user: User, todo: Todo): Promise<void>;
}
