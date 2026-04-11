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
  data?: Record<string, any>;
}

export type NotificationType = "daily" | "reminder" | "now";
