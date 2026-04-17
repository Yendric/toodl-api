import { ToodlError } from "#/errors/ToodlError.js";
import prisma from "#/prisma.js";
import { AuthService } from "#/services/AuthService.js";
import { LoggingService } from "#/services/LoggingService.js";
import { MailService } from "#/services/MailService.js";
import { UserService } from "#/services/UserService.js";
import bcrypt from "bcryptjs";
import { vi } from "vitest";

vi.mock("google-auth-library", () => {
  return {
    OAuth2Client: class {
      verifyIdToken = vi.fn().mockImplementation(({ idToken }) => {
        if (idToken === "valid-token-new") {
          return { getPayload: () => ({ email: "new@google.com", name: "New Google User" }) };
        } else if (idToken === "valid-token-existing") {
          return { getPayload: () => ({ email: "existing@google.com", name: "Existing Google User" }) };
        } else {
          return { getPayload: () => null };
        }
      });
    },
  };
});

describe("AuthService", () => {
  let authService: AuthService;
  let userService: UserService;
  let mailService: MailService;

  beforeEach(() => {
    vi.clearAllMocks();
    mailService = new MailService(new LoggingService());
    mailService.sendWelcomeMail = vi.fn() as any;
    mailService.sendRemovalMail = vi.fn() as any;
    userService = new UserService(mailService);
    authService = new AuthService(userService, mailService);
  });

  describe("register", () => {
    it("should register a new user", async () => {
      const userData = { username: "testuser", email: "test@example.com", password: "password123" };

      await authService.register(userData.username, userData.email, userData.password);

      expect(mailService.sendWelcomeMail).toHaveBeenCalled();

      const savedUser = await prisma.user.findUnique({ where: { email: userData.email } });
      expect(savedUser).toBeDefined();
      expect(savedUser?.username).toBe(userData.username);
      expect(await bcrypt.compare(userData.password, savedUser!.password!)).toBe(true);
    });

    it("should throw error if email already exists", async () => {
      await prisma.user.create({ data: { username: "existing", email: "test@example.com" } });

      await expect(authService.register("testuser", "test@example.com", "password")).rejects.toThrow(ToodlError);
    });
  });

  describe("login", () => {
    it("should login with correct credentials", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = await prisma.user.create({
        data: { username: "loginuser", email: "testlogin@example.com", password: hashedPassword },
      });

      const result = await authService.login("testlogin@example.com", "password123");

      expect(result.id).toEqual(user.id);
    });

    it("should throw error with incorrect password", async () => {
      const hashedPassword = await bcrypt.hash("realpassword", 10);
      await prisma.user.create({
        data: { username: "loginuser", email: "testlogin2@example.com", password: hashedPassword },
      });

      await expect(authService.login("testlogin2@example.com", "wrongpassword")).rejects.toThrow(ToodlError);
    });
  });

  describe("google", () => {
    it("should register a new user on google login if not exists", async () => {
      const user = await authService.google("valid-token-new");
      expect(user.email).toBe("new@google.com");
      expect(mailService.sendWelcomeMail).toHaveBeenCalled();

      const savedUser = await prisma.user.findUnique({ where: { email: "new@google.com" } });
      expect(savedUser).toBeDefined();
    });

    it("should login user if google user already exists", async () => {
      await prisma.user.create({ data: { username: "Existing User", email: "existing@google.com" } });

      const user = await authService.google("valid-token-existing");
      expect(user.email).toBe("existing@google.com");
    });

    it("should throw error if google payload is invalid", async () => {
      await expect(authService.google("invalid-token")).rejects.toThrow(ToodlError);
    });
  });
});
