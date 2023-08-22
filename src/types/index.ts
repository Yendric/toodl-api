import { User } from "@prisma/client";

declare module "express-session" {
  interface SessionData {
    user: User;
    loggedIn: boolean;
    userId: number;
  }
}
