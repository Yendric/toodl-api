import { iocContainer } from "#/ioc.js";
import { LoggingService } from "#/services/LoggingService.js";
import type { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const logger = iocContainer.get(LoggingService);
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.log(`[REQUEST] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
}
