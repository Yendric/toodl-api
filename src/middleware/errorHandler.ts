import { ToodlError } from "@/errors/ToodlError";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

function handleError(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({ message: "Validation error", errors: err.errors });
  } else if (err instanceof ToodlError) {
    return res.status(422).json({ message: err.message });
  } else {
    console.log(err);
    return res.status(500).json({ message: "Er is iets foutgegaan." });
  }
}

export default handleError;
