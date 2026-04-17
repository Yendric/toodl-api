import prisma from "#/prisma.js";
import { type PushSubscriptionData } from "#/types/notifications.js";
import { type Todo, type User } from "#/generated/prisma/client.js";
import { MailProvider } from "#/providers/MailProvider.js";
import { WebPushProvider } from "#/providers/WebPushProvider.js";
import { inject, injectable } from "inversify";
import { LoggingService } from "./LoggingService.js";

export interface INotificationService {
  subscribe(userId: number, subscription: PushSubscriptionData): Promise<void>;
  unsubscribe(endpoint: string): Promise<void>;
  dispatchDaily(user: User, todos: Todo[]): Promise<void>;
  dispatchReminder(user: User, todo: Todo): Promise<void>;
  dispatchNow(user: User, todo: Todo): Promise<void>;
}

@injectable()
export class NotificationService implements INotificationService {
  constructor(
    @inject(MailProvider) private mailProvider: MailProvider,
    @inject(WebPushProvider) private webPushProvider: WebPushProvider,
    @inject(LoggingService) private loggingService: LoggingService,
  ) {}

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
    } catch (_e) {
      // Ignore if it doesn't exist
    }
  }

  public async dispatchDaily(user: User, todos: Todo[]): Promise<void> {
    const promises: Promise<void>[] = [];
    if (user.dailyNotification) {
      promises.push(this.mailProvider.sendDaily(user, todos));
    }
    if (user.dailyPush) {
      promises.push(this.webPushProvider.sendDaily(user, todos));
    }

    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
      if (result.status === "rejected") {
        this.loggingService.error(
          `Provider failed to send daily notification to user ${user.id}: ${String(result.reason)}`,
        );
      }
    });
  }

  public async dispatchReminder(user: User, todo: Todo): Promise<void> {
    const promises: Promise<void>[] = [];
    if (user.reminderNotification) {
      promises.push(this.mailProvider.sendReminder(user, todo));
    }
    if (user.reminderPush) {
      promises.push(this.webPushProvider.sendReminder(user, todo));
    }

    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
      if (result.status === "rejected") {
        this.loggingService.error(
          `Provider failed to send reminder notification to user ${user.id}: ${String(result.reason)}`,
        );
      }
    });
  }

  public async dispatchNow(user: User, todo: Todo): Promise<void> {
    const promises: Promise<void>[] = [];
    if (user.nowNotification) {
      promises.push(this.mailProvider.sendNow(user, todo));
    }
    if (user.nowPush) {
      promises.push(this.webPushProvider.sendNow(user, todo));
    }

    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
      if (result.status === "rejected") {
        this.loggingService.error(
          `Provider failed to send now notification to user ${user.id}: ${String(result.reason)}`,
        );
      }
    });
  }
}
