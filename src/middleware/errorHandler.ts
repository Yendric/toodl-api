import { ToodlError } from "@/errors/ToodlError";
import { NextFunction, Request, Response } from "express";
import { ValidateError } from "tsoa";
import { ZodError } from "zod";

function handleError(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ValidateError) {
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  } else if (err instanceof ZodError) {
    return res.status(422).json({ message: "Validation error", errors: err.errors });
  } else if (err instanceof ToodlError) {
    return res.status(422).json({ message: err.message });
  } else if (err.message === "Gelieve u eerst in te loggen" || err.status === 401) {
    return res.status(401).json({ message: err.message });
  } else {
    console.log(err);
    return res.status(err.status ?? 500).json({ message: err.message || "Er is iets foutgegaan." });
  }
}

export default handleError;
