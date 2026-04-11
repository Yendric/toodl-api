import prisma from "#/prisma.js";
import { NotificationService } from "#/services/NotificationService.js";
import webpush from "web-push";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

vi.mock("#/prisma.js", () => ({
  default: {
    pushSubscription: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("NotificationService", () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    notificationService = new NotificationService();
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

  describe("sendPush", () => {
    it("should send push if enabled in preferences", async () => {
      const userId = 1;
      const user = {
        id: userId,
        dailyPush: true,
        pushSubscriptions: [
          { endpoint: "sub1", p256dh: "p1", auth: "a1" },
        ],
      };
      (prisma.user.findUnique as Mock).mockResolvedValue(user);
      (webpush.sendNotification as Mock).mockResolvedValue({});

      await notificationService.sendPush(userId, { title: "Test" }, "daily");

      expect(webpush.sendNotification).toHaveBeenCalled();
    });

    it("should not send push if disabled in preferences", async () => {
      const userId = 1;
      const user = {
        id: userId,
        dailyPush: false,
        pushSubscriptions: [
          { endpoint: "sub1", p256dh: "p1", auth: "a1" },
        ],
      };
      (prisma.user.findUnique as Mock).mockResolvedValue(user);

      await notificationService.sendPush(userId, { title: "Test" }, "daily");

      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it("should prune subscription if 404 or 410", async () => {
      const userId = 1;
      const user = {
        id: userId,
        dailyPush: true,
        pushSubscriptions: [
          { endpoint: "sub1", p256dh: "p1", auth: "a1" },
        ],
      };
      (prisma.user.findUnique as Mock).mockResolvedValue(user);
      (webpush.sendNotification as Mock).mockRejectedValue({ statusCode: 410 });

      await notificationService.sendPush(userId, { title: "Test" }, "daily");

      expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { endpoint: "sub1" },
      });
    });
  });
});
