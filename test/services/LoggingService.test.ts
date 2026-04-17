import { LoggingService } from "#/services/LoggingService.js";
import colors from "@colors/colors";
import { vi, describe, beforeEach, afterEach, it, expect } from "vitest";

describe("LoggingService", () => {
  let loggingService: LoggingService;
  let consoleInfoSpy: any;

  beforeEach(() => {
    loggingService = new LoggingService();
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("log", () => {
    it("should call console.info with formatted message", () => {
      const message = "Test message";
      loggingService.log(message);
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const callArgs = consoleInfoSpy.mock.calls[0][0];
      expect(callArgs).toContain(message);
      expect(callArgs).toContain(colors.white("x").split("x")[0]);
    });
  });

  describe("announce", () => {
    it("should call console.info with bgGreen formatted message", () => {
      const message = "Announce message";
      loggingService.announce(message);
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const callArgs = consoleInfoSpy.mock.calls[0][0];
      expect(callArgs).toContain(message);
      expect(callArgs).toContain(colors.bgGreen("x").split("x")[0]);
    });
  });

  describe("success", () => {
    it("should call console.info with green formatted message", () => {
      const message = "Success message";
      loggingService.success(message);
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const callArgs = consoleInfoSpy.mock.calls[0][0];
      expect(callArgs).toContain(message);
      expect(callArgs).toContain(colors.green("x").split("x")[0]);
    });
  });

  describe("error", () => {
    it("should call console.info with red formatted message", () => {
      const message = "Error message";
      loggingService.error(message);
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const callArgs = consoleInfoSpy.mock.calls[0][0];
      expect(callArgs).toContain(message);
      expect(callArgs).toContain(colors.red("x").split("x")[0]);
    });
  });
});
