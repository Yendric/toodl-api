import { ToodlError } from "#/errors/ToodlError.js";
import prisma from "#/prisma.js";
import { UserService } from "#/services/UserService.js";
import bcrypt from "bcryptjs";
import { vi } from "vitest";
import { MailService } from "#/services/MailService.js";
import { LoggingService } from "#/services/LoggingService.js";

describe("UserService", () => {
  let userService: UserService;
  let mailService: MailService;

  beforeEach(() => {
    vi.clearAllMocks();
    mailService = new MailService(new LoggingService());
    mailService.sendRemovalMail = vi.fn() as any;
    userService = new UserService(mailService);
  });

  describe("createUserWithDefaults", () => {
    it("should create a user and default lists/todos within a transaction", async () => {
      const userData = { email: "test@example.com", username: "testuser", password: "password123" };
      const result = await userService.createUserWithDefaults(userData);

      const dbUser = await prisma.user.findUnique({ where: { email: "test@example.com" } });
      expect(dbUser).not.toBeNull();
      expect(result.id).toBe(dbUser?.id);

      const lists = await prisma.list.findMany({ where: { userId: result.id } });
      expect(lists).toHaveLength(2);

      const stores = await prisma.store.findMany({ where: { userId: result.id } });
      expect(stores).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("should update a user and lowercase the email", async () => {
      await prisma.user.create({ data: { id: 1, email: "old@example.com", username: "olduser" } });

      const updateData = { email: "UPDATED@EXAMPLE.COM", username: "newuser" };
      const result = await userService.update(1, updateData);

      expect(result.email).toBe("updated@example.com");
      expect(result.username).toBe("newuser");

      const dbUser = await prisma.user.findUnique({ where: { id: 1 } });
      expect(dbUser?.email).toBe("updated@example.com");
      expect(dbUser?.username).toBe("newuser");
    });

    it("should update a user without email", async () => {
      await prisma.user.create({ data: { id: 1, email: "test@example.com", username: "olduser" } });

      const updateData = { username: "newuser" };
      const result = await userService.update(1, updateData);

      expect(result.username).toBe("newuser");

      const dbUser = await prisma.user.findUnique({ where: { id: 1 } });
      expect(dbUser?.username).toBe("newuser");
      expect(dbUser?.email).toBe("test@example.com");
    });
  });

  describe("delete", () => {
    it("should delete a user and send a removal mail", async () => {
      const user = await prisma.user.create({ data: { id: 1, email: "test@example.com", username: "testuser" } });

      await userService.delete(user as any);

      const dbUser = await prisma.user.findUnique({ where: { id: 1 } });
      expect(dbUser).toBeNull();
      expect(mailService.sendRemovalMail).toHaveBeenCalledWith(user);
    });
  });

  describe("updatePassword", () => {
    it("should throw error if new passwords do not match", async () => {
      const user = await prisma.user.create({
        data: { id: 1, email: "test@example.com", password: "oldHashedPassword", username: "test" },
      });
      await expect(
        userService.updatePassword(user as any, { newPassword: "new", confirmPassword: "different" }),
      ).rejects.toThrow(ToodlError);
    });

    it("should update password directly if user has no password (SSO)", async () => {
      const user = await prisma.user.create({ data: { id: 1, email: "test@example.com", username: "test" } });

      await userService.updatePassword(user as any, { newPassword: "new", confirmPassword: "new" });

      const dbUser = await prisma.user.findUnique({ where: { id: 1 } });
      expect(await bcrypt.compare("new", dbUser!.password!)).toBe(true);
    });

    it("should throw error if old password is not provided when user has a password", async () => {
      const user = await prisma.user.create({
        data: { id: 1, email: "test@example.com", password: "oldHashedPassword", username: "test" },
      });

      await expect(
        userService.updatePassword(user as any, { newPassword: "new", confirmPassword: "new" }),
      ).rejects.toThrow(ToodlError);
    });

    it("should throw error if old password does not match", async () => {
      const hashedPassword = await bcrypt.hash("correct", 10);
      const user = await prisma.user.create({
        data: { id: 1, email: "test@example.com", password: hashedPassword, username: "test" },
      });

      await expect(
        userService.updatePassword(user as any, { newPassword: "new", confirmPassword: "new", oldPassword: "wrong" }),
      ).rejects.toThrow(ToodlError);
    });

    it("should update password if old password matches", async () => {
      const hashedPassword = await bcrypt.hash("correct", 10);
      const user = await prisma.user.create({
        data: { id: 1, email: "test@example.com", password: hashedPassword, username: "test" },
      });

      await userService.updatePassword(user as any, {
        newPassword: "new",
        confirmPassword: "new",
        oldPassword: "correct",
      });

      const dbUser = await prisma.user.findUnique({ where: { id: 1 } });
      expect(await bcrypt.compare("new", dbUser!.password!)).toBe(true);
    });
  });
});
