import { ToodlError } from "#/errors/ToodlError.js";
import removalMail from "#/mail/emails/removalMail.js";
import prisma from "#/prisma.js";
import { UserService } from "#/services/UserService.js";
import bcrypt from "bcryptjs";
import { type Mock, vi } from "vitest";

vi.mock("#/prisma.js", () => ({
  default: {
    $transaction: vi.fn(),
    user: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    list: {
      create: vi.fn(),
    },
    todo: {
      create: vi.fn(),
    },
    category: {
      create: vi.fn(),
    },
    store: {
      create: vi.fn(),
    },
    storeCategoryOrder: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("#/mail/emails/removalMail.js", () => ({
  default: vi.fn(),
}));

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
  });

  describe("createUserWithDefaults", () => {
    it("should create a user and default lists/todos within a transaction", async () => {
      const mockUser = { id: 1, email: "test@example.com", username: "testuser" };
      const mockBoodschappenList = { id: 10, userId: 1, name: "Boodschappen", color: "#33AAFF" };
      const mockPlanningList = { id: 11, userId: 1, name: "Planning", color: "#FF0000" };
      const mockCategory = { id: 20, name: "Test Category", userId: 1 };
      const mockStore = { id: 30, name: "Supermarkt", userId: 1 };

      (prisma.$transaction as Mock).mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
        // Simulate the transaction object by passing the mocked prisma models
        const tx = {
          user: { create: vi.fn().mockResolvedValue(mockUser) },
          category: { create: vi.fn().mockResolvedValue(mockCategory) },
          store: { create: vi.fn().mockResolvedValue(mockStore) },
          storeCategoryOrder: { createMany: vi.fn().mockResolvedValue({}) },
          list: {
            create: vi.fn().mockResolvedValueOnce(mockBoodschappenList).mockResolvedValueOnce(mockPlanningList),
          },
          todo: { create: vi.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      const userData = { email: "test@example.com", username: "testuser", password: "password123" };
      const result = await userService.createUserWithDefaults(userData);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe("update", () => {
    it("should update a user and lowercase the email", async () => {
      const updatedUser = { id: 1, email: "updated@example.com", username: "newuser" };
      (prisma.user.update as Mock).mockResolvedValue(updatedUser);

      const updateData = { email: "UPDATED@EXAMPLE.COM", username: "newuser" };
      const result = await userService.update(1, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          username: "newuser",
          email: "updated@example.com",
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it("should update a user without email", async () => {
      const updatedUser = { id: 1, email: "test@example.com", username: "newuser" };
      (prisma.user.update as Mock).mockResolvedValue(updatedUser);

      const updateData = { username: "newuser" };
      const result = await userService.update(1, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          username: "newuser",
          email: undefined,
        },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe("delete", () => {
    it("should delete a user and send a removal mail", async () => {
      const user: any = { id: 1, email: "test@example.com", username: "testuser" };

      await userService.delete(user);

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(removalMail).toHaveBeenCalledWith(user);
    });
  });

  describe("updatePassword", () => {
    it("should throw error if new passwords do not match", async () => {
      const user: any = { id: 1, password: "oldHashedPassword" };
      await expect(
        userService.updatePassword(user, { newPassword: "new", confirmPassword: "different" }),
      ).rejects.toThrow(ToodlError);
    });

    it("should update password directly if user has no password (SSO)", async () => {
      const user: any = { id: 1, password: null };
      (bcrypt.hash as Mock).mockResolvedValue("newHashedPassword");

      await userService.updatePassword(user, { newPassword: "new", confirmPassword: "new" });

      expect(bcrypt.hash).toHaveBeenCalledWith("new", 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: "newHashedPassword" },
      });
    });

    it("should throw error if old password is not provided when user has a password", async () => {
      const user: any = { id: 1, password: "oldHashedPassword" };

      await expect(userService.updatePassword(user, { newPassword: "new", confirmPassword: "new" })).rejects.toThrow(
        ToodlError,
      );
    });

    it("should throw error if old password does not match", async () => {
      const user: any = { id: 1, password: "oldHashedPassword" };
      (bcrypt.compare as Mock).mockResolvedValue(false);

      await expect(
        userService.updatePassword(user, { newPassword: "new", confirmPassword: "new", oldPassword: "wrong" }),
      ).rejects.toThrow(ToodlError);
    });

    it("should update password if old password matches", async () => {
      const user: any = { id: 1, password: "oldHashedPassword" };
      (bcrypt.compare as Mock).mockResolvedValue(true);
      (bcrypt.hash as Mock).mockResolvedValue("newHashedPassword");

      await userService.updatePassword(user, { newPassword: "new", confirmPassword: "new", oldPassword: "correct" });

      expect(bcrypt.compare).toHaveBeenCalledWith("correct", "oldHashedPassword");
      expect(bcrypt.hash).toHaveBeenCalledWith("new", 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: "newHashedPassword" },
      });
    });
  });
});
