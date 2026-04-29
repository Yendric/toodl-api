import { MailService } from "#/services/MailService.js";
import { LoggingService } from "#/services/LoggingService.js";
import { vi, describe, beforeEach, it, expect } from "vitest";

const mockSend = vi.fn().mockResolvedValue({ data: { id: "123" }, error: null });

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: mockSend,
    };
  },
}));

describe("MailService", () => {
  let mailService: MailService;
  let loggingService: LoggingService;

  beforeEach(() => {
    vi.clearAllMocks();
    loggingService = new LoggingService();
    vi.spyOn(loggingService, "success").mockImplementation(() => {});
    vi.spyOn(loggingService, "error").mockImplementation(() => {});

    mailService = new MailService(loggingService);
  });

  it("should send a welcome email", async () => {
    const user = { email: "test@example.com", username: "testuser" };
    await mailService.sendWelcomeMail(user);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: expect.stringContaining("Welkom"),
      }),
    );
    expect(loggingService.success).toHaveBeenCalled();
  });

  it("should send a removal email", async () => {
    const user = { email: "test@example.com", username: "testuser" };
    await mailService.sendRemovalMail(user);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: expect.stringContaining("verwijderd"),
      }),
    );
    expect(loggingService.success).toHaveBeenCalled();
  });

  it("should log an error if sending fails with error object", async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });
    const user = { email: "test@example.com", username: "testuser" };

    await mailService.sendWelcomeMail(user);

    expect(loggingService.error).toHaveBeenCalledWith(expect.stringContaining("API Error"));
  });

  it("should log an error if sending throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("SMTP Error"));
    const user = { email: "test@example.com", username: "testuser" };

    await mailService.sendWelcomeMail(user);

    expect(loggingService.error).toHaveBeenCalledWith(expect.stringContaining("Error"));
  });
});
