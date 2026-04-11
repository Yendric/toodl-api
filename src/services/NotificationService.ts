import prisma from "#/prisma.js";
import { type NotificationType, type PushPayload, type PushSubscriptionData } from "#/types/notifications.js";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface INotificationService {
  subscribe(userId: number, subscription: PushSubscriptionData): Promise<void>;
  unsubscribe(endpoint: string): Promise<void>;
  sendPush(userId: number, payload: PushPayload, type: NotificationType): Promise<void>;
}

export class NotificationService implements INotificationService {
  public async subscribe(userId: number, subscription: PushSubscriptionData): Promise<void> {
    const { endpoint, keys } = subscription;
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId,
      },
    });
  }

  public async unsubscribe(endpoint: string): Promise<void> {
    try {
      await prisma.pushSubscription.delete({
        where: { endpoint },
      });
    } catch (e) {
      // Ignore if it doesn't exist
    }
  }

  public async sendPush(userId: number, payload: PushPayload, type: NotificationType): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pushSubscriptions: true },
    });

    if (!user) return;

    // Check preferences
    const isEnabled =
      (type === "daily" && user.dailyPush) ||
      (type === "reminder" && user.reminderPush) ||
      (type === "now" && user.nowPush);

    if (!isEnabled) return;

    const payloadString = JSON.stringify(payload);

    const pushPromises = user.pushSubscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payloadString);
      } catch (error: any) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`Pruning invalid subscription for user ${userId}: ${sub.endpoint}`);
          await this.unsubscribe(sub.endpoint);
        } else {
          console.error(`Failed to send push to ${sub.endpoint}:`, error);
        }
      }
    });

    await Promise.all(pushPromises);
  }
}
