import { ToodlError } from "#/errors/ToodlError.js";
import welcomeMail from "#/mail/emails/welcomeMail.js";
import { AuthService } from "#/services/AuthService.js";
import { type IUserService } from "#/services/UserService.js";
import { getUserByEmail } from "#/utils/database.js";
import { type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type Mock, type Mocked, vi } from "vitest";

vi.mock("#/prisma.js", () => ({
  default: {
    user: {
      create: vi.fn(),
    },
  },
}));

vi.mock("#/utils/database.js", () => ({
  getUserByEmail: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("#/mail/emails/welcomeMail.js", () => ({ default: vi.fn() }));

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserService: Mocked<IUserService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserService = {
      createUserWithDefaults: vi.fn().mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      update: vi.fn(),
      delete: vi.fn(),
      updatePassword: vi.fn(),
    };
    authService = new AuthService(mockUserService);
  });

  describe("register", () => {
    it("should register a new user", async () => {
      const userData = { username: "testuser", email: "test@example.com", password: "password123" };
      (getUserByEmail as Mock).mockResolvedValue(null);
      (bcrypt.hash as Mock).mockResolvedValue("hashedPassword");

      const result = await authService.register(userData.username, userData.email, userData.password);

      expect(getUserByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUserService.createUserWithDefaults).toHaveBeenCalledWith({
        username: userData.username,
        email: userData.email,
        password: "hashedPassword",
      });
      expect(welcomeMail).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it("should throw error if email already exists", async () => {
      (getUserByEmail as Mock).mockResolvedValue({ id: 1, email: "test@example.com" } as User);

      await expect(authService.register("testuser", "test@example.com", "password")).rejects.toThrow(ToodlError);
    });
  });

  describe("login", () => {
    it("should login with correct credentials", async () => {
      const user = { id: 1, email: "test@example.com", password: "hashedPassword" } as User;
      (getUserByEmail as Mock).mockResolvedValue(user);
      (bcrypt.compare as Mock).mockResolvedValue(true);

      const result = await authService.login("test@example.com", "password123");

      expect(result).toEqual(user);
    });

    it("should throw error with incorrect password", async () => {
      const user = { id: 1, email: "test@example.com", password: "hashedPassword" } as User;
      (getUserByEmail as Mock).mockResolvedValue(user);
      (bcrypt.compare as Mock).mockResolvedValue(false);

      await expect(authService.login("test@example.com", "wrongpassword")).rejects.toThrow(ToodlError);
    });
  });
});
