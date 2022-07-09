import { Request, Response, NextFunction } from "express";
import { ToodlError } from "@/errors/ToodlError";

function handleError(err: Error, req: Request, res: Response, next: NextFunction) {
  let status = 422;

  if (!(err instanceof ToodlError)) {
    console.log(err);
    err = new ToodlError("Er is iets foutgegaan.", "Server error");
    status = 500;
  }
  res.status(status).json({ message: err.message });
}

export default handleError;
