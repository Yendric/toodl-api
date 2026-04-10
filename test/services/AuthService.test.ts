import { AuthService } from "@/services/AuthService";
import prisma from "@/prisma";
import { getUserByEmail } from "@/utils/database";
import bcrypt from "bcryptjs";
import welcomeMail from "@/mail/emails/welcomeMail";
import { ToodlError } from "@/errors/ToodlError";
import { IUserService } from "@/services/UserService";

jest.mock("@/prisma", () => ({
  user: {
    create: jest.fn(),
  },
}));

jest.mock("@/utils/database", () => ({
  getUserByEmail: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("@/mail/emails/welcomeMail");

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<IUserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserService = {
      createDefaults: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
      delete: jest.fn(),
      updatePassword: jest.fn(),
    } as any;
    authService = new AuthService(mockUserService);
  });

  describe("register", () => {
    it("should register a new user", async () => {
      const userData = { username: "testuser", email: "test@example.com", password: "password123" };
      (getUserByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 1, ...userData });

      const result = await authService.register(userData.username, userData.email, userData.password);

      expect(getUserByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(mockUserService.createDefaults).toHaveBeenCalledWith(1);
      expect(welcomeMail).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it("should throw error if email already exists", async () => {
      (getUserByEmail as jest.Mock).mockResolvedValue({ id: 1, email: "test@example.com" });

      await expect(authService.register("testuser", "test@example.com", "password"))
        .rejects.toThrow(ToodlError);
    });
  });

  describe("login", () => {
    it("should login with correct credentials", async () => {
      const user = { id: 1, email: "test@example.com", password: "hashedPassword" } as any;
      (getUserByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login("test@example.com", "password123");

      expect(result).toEqual(user);
    });

    it("should throw error with incorrect password", async () => {
      const user = { id: 1, email: "test@example.com", password: "hashedPassword" } as any;
      (getUserByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login("test@example.com", "wrongpassword"))
        .rejects.toThrow(ToodlError);
    });
  });
});
