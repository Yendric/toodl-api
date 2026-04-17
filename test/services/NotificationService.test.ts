import prisma from "#/prisma.js";
import { MailProvider } from "#/providers/MailProvider.js";
import { WebPushProvider } from "#/providers/WebPushProvider.js";
import { LoggingService } from "#/services/LoggingService.js";
import { NotificationService } from "#/services/NotificationService.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("NotificationService", () => {
  let notificationService: NotificationService;
  let mockMailProvider: Partial<MailProvider>;
  let mockWebPushProvider: Partial<WebPushProvider>;
  let mockLoggingService: Partial<LoggingService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMailProvider = {
      sendDaily: vi.fn().mockResolvedValue(undefined),
      sendReminder: vi.fn().mockResolvedValue(undefined),
      sendNow: vi.fn().mockResolvedValue(undefined),
    };
    mockWebPushProvider = {
      sendDaily: vi.fn().mockResolvedValue(undefined),
      sendReminder: vi.fn().mockResolvedValue(undefined),
      sendNow: vi.fn().mockResolvedValue(undefined),
    };
    mockLoggingService = {
      error: vi.fn(),
    };
    notificationService = new NotificationService(
      mockMailProvider as MailProvider,
      mockWebPushProvider as WebPushProvider,
      mockLoggingService as LoggingService,
    );
  });

  describe("subscribe", () => {
    it("should upsert a push subscription", async () => {
      const userId = 1;
      const subscription = {
        endpoint: "https://example.com",
        keys: { p256dh: "p256dh", auth: "auth" },
      };

      await notificationService.subscribe(userId, subscription);

      expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: subscription.endpoint },
        update: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        create: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId,
        },
      });
    });
  });

  describe("dispatchDaily", () => {
    it("should dispatch to both providers if enabled", async () => {
      const user = { dailyNotification: true, dailyPush: true } as any;
      const todos = [] as any;

      await notificationService.dispatchDaily(user, todos);

      expect(mockMailProvider.sendDaily).toHaveBeenCalledWith(user, todos);
      expect(mockWebPushProvider.sendDaily).toHaveBeenCalledWith(user, todos);
    });

    it("should only dispatch mail if dailyPush is false", async () => {
      const user = { dailyNotification: true, dailyPush: false } as any;
      const todos = [] as any;

      await notificationService.dispatchDaily(user, todos);

      expect(mockMailProvider.sendDaily).toHaveBeenCalledWith(user, todos);
      expect(mockWebPushProvider.sendDaily).not.toHaveBeenCalled();
    });

    it("should log errors if a provider fails", async () => {
      const user = { id: 1, dailyNotification: true, dailyPush: true } as any;
      const todos = [] as any;
      mockMailProvider.sendDaily = vi.fn().mockRejectedValue(new Error("Mail error"));

      await notificationService.dispatchDaily(user, todos);

      expect(mockLoggingService.error).toHaveBeenCalledWith(
        expect.stringContaining("Provider failed to send daily notification to user 1: Error: Mail error"),
      );
    });
  });
});
