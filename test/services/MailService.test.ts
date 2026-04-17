import { MailService } from "#/services/MailService.js";
import { LoggingService } from "#/services/LoggingService.js";
import { vi, describe, beforeEach, it, expect } from "vitest";
import nodemailer from "nodemailer";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ response: "250 OK" }),
    }),
  },
}));

describe("MailService", () => {
  let mailService: MailService;
  let loggingService: LoggingService;
  let transporterMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    loggingService = new LoggingService();
    vi.spyOn(loggingService, "success").mockImplementation(() => {});
    vi.spyOn(loggingService, "error").mockImplementation(() => {});

    mailService = new MailService(loggingService);
    transporterMock = (nodemailer.createTransport as any).mock.results[0].value;
  });

  it("should send a welcome email", async () => {
    const user = { email: "test@example.com", username: "testuser" };
    await mailService.sendWelcomeMail(user);

    expect(transporterMock.sendMail).toHaveBeenCalledWith(
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

    expect(transporterMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: expect.stringContaining("verwijderd"),
      }),
    );
    expect(loggingService.success).toHaveBeenCalled();
  });

  it("should log an error if sending fails", async () => {
    transporterMock.sendMail.mockRejectedValueOnce(new Error("SMTP Error"));
    const user = { email: "test@example.com", username: "testuser" };

    await mailService.sendWelcomeMail(user);

    expect(loggingService.error).toHaveBeenCalledWith(expect.stringContaining("Fout"));
  });
});
