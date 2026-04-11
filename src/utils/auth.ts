import { ToodlError } from "#/errors/ToodlError.js";
import { type Request } from "express";

export function getAuthenticatedUserId(req: Request) {
  if (req.session.userId) {
    return req.session.userId;
  }

  throw new ToodlError("Gelieve u eerst in te loggen", "UnauthenticatedError");
}

export function getAuthenticatedUser(req: Request) {
  if (req.session.user) {
    return req.session.user;
  }

  throw new ToodlError("Gelieve u eerst in te loggen", "UnauthenticatedError");
}
