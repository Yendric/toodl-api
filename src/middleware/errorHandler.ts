import { ToodlError } from "#/errors/ToodlError.js";
import { iocContainer } from "#/ioc.js";
import { LoggingService } from "#/services/LoggingService.js";
import type { NextFunction, Request, Response } from "express";
import { ValidateError } from "tsoa";
import { ZodError } from "zod";

function handleError(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ValidateError) {
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  } else if (err instanceof ZodError) {
    return res.status(422).json({ message: "Validation error", errors: err.errors });
  } else if (err instanceof ToodlError) {
    return res.status(err.status).json({ message: err.message });
  } else {
    const logger = iocContainer.get(LoggingService);
    logger.error(`Unhandled error: ${err instanceof Error ? err.stack : String(err)}`);
    return res.status(500).json({ message: "Er is iets foutgegaan." });
  }
}

export default handleError;
