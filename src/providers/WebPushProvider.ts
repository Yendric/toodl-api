import prisma from "#/prisma.js";
import { type PushPayload, type INotificationProvider } from "#/types/notifications.js";
import { type Todo, type User, type PushSubscription } from "#/generated/prisma/client.js";
import { inject, injectable } from "inversify";
import webpush from "web-push";
import { LoggingService } from "#/services/LoggingService.js";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT!;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

@injectable()
export class WebPushProvider implements INotificationProvider {
  constructor(@inject(LoggingService) private loggingService: LoggingService) {}

  private async sendPayloadToUser(user: User & { pushSubscriptions?: PushSubscription[] }, payload: PushPayload): Promise<void> {
    const pushSubscriptions = user.pushSubscriptions || await prisma.pushSubscription.findMany({
      where: { userId: user.id },
    });

    if (!pushSubscriptions || pushSubscriptions.length === 0) return;

    const payloadString = JSON.stringify(payload);

    const pushPromises = pushSubscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payloadString);
      } catch (error: unknown) {
        const err = error as { statusCode?: number };
        if (err.statusCode === 404 || err.statusCode === 410) {
          this.loggingService.log(`Pruning invalid subscription for user ${user.id}: ${sub.endpoint}`);
          await prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint },
          }).catch(() => {});
        } else {
          this.loggingService.error(`Failed to send push to ${sub.endpoint}: ${String(error)}`);
          throw error;
        }
      }
    });

    await Promise.all(pushPromises);
  }

  public async sendDaily(user: User, todos: Todo[]): Promise<void> {
    const payload: PushPayload = {
      title: "Todo's voor morgen",
      body: `Je hebt morgen ${todos.length} todo('s) gepland.`,
      data: {
        url: "/",
      },
    };
    await this.sendPayloadToUser(user, payload);
  }

  public async sendReminder(user: User, todo: Todo): Promise<void> {
    const payload: PushPayload = {
      title: "Todo over een kwartier",
      body: todo.subject,
      data: {
        url: "/",
      },
    };
    await this.sendPayloadToUser(user, payload);
  }

  public async sendNow(user: User, todo: Todo): Promise<void> {
    const payload: PushPayload = {
      title: "U heeft een todo gepland",
      body: todo.subject,
      data: {
        url: "/",
      },
    };
    await this.sendPayloadToUser(user, payload);
  }
}
