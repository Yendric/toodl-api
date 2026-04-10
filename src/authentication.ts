import { getUserById } from "@/utils/database";
import { Request } from "express";

export async function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[],
): Promise<any> {
  if (securityName === "session") {
    if (request.session?.loggedIn && request.session.userId) {
      const user = await getUserById(request.session.userId);

      if (!user) {
        // Gebruiker bestaat niet meer
        return Promise.reject(new Error("User not found"));
      }

      request.session.user = user;
      return Promise.resolve(user);
    }
    return Promise.reject(new Error("Gelieve u eerst in te loggen"));
  }
  return Promise.reject(new Error("Unknown security name"));
}
