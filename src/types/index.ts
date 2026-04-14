import { type User } from "#/generated/prisma/client.js";

declare module "express-session" {
  interface SessionData {
    user: User;
    loggedIn: boolean;
    userId: number;
  }
}
