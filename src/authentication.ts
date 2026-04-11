import { ToodlError } from "#/errors/ToodlError.js";
import { getUserById } from "#/utils/database.js";
import { type User } from "@prisma/client";
import { type Request } from "express";

export async function expressAuthentication(request: Request, securityName: string): Promise<User> {
  if (securityName === "session") {
    if (request.session?.loggedIn && request.session.userId) {
      const user = await getUserById(request.session.userId);

      if (!user) {
        // Gebruiker bestaat niet meer
        throw new ToodlError("User not found", "UnauthorizedError", 401);
      }

      request.session.user = user;
      return user;
    }
    throw new ToodlError("Gelieve u eerst in te loggen", "UnauthorizedError", 401);
  }
  throw new ToodlError("Unknown security name", "InternalError", 500);
}
