import http from "http";
import User from "../models/User";

declare module "express-session" {
  interface SessionData {
    user?: User;
    loggedIn?: boolean;
    userId?: number;
  }
}

export interface IncomingMessage extends http.IncomingMessage {
  session?: {
    user?: User;
    loggedIn?: boolean;
    userId?: number;
  };
}
