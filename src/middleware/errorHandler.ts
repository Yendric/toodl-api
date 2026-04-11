import { ToodlError } from "@/errors/ToodlError";
import { NextFunction, Request, Response } from "express";
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
  } else if (err instanceof Error && err.message === "Gelieve u eerst in te loggen") {
    return res.status(401).json({ message: err.message });
  } else {
    const status = (err && typeof err === "object" && "status" in err && typeof err.status === "number") ? err.status : 500;
    const message = (err && typeof err === "object" && "message" in err && typeof err.message === "string") ? err.message : "Er is iets foutgegaan.";
    
    if (status === 500) {
      console.log(err);
    }
    
    return res.status(status).json({ message });
  }
}

export default handleError;
