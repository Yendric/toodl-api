import { getUserById } from "@/utils/database";
import { User } from "@prisma/client";
import { Request } from "express";

export async function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[],
): Promise<User> {
  if (securityName === "session") {
    if (request.session?.loggedIn && request.session.userId) {
      const user = await getUserById(request.session.userId);

      if (!user) {
        // Gebruiker bestaat niet meer
        throw new Error("User not found");
      }

      request.session.user = user;
      return user;
    }
    throw new Error("Gelieve u eerst in te loggen");
  }
  throw new Error("Unknown security name");
}
