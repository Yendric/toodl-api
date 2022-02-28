import { NextFunction, Request, Response } from "express";
import { IncomingMessage } from "../types";
import { ExtendedError } from "socket.io/dist/namespace";
import { getUserById } from "../utils/database";

/*
/ Deze middleware kan zowel gebruikt worden door express als door socket.io, vandaar de union types.
*/
const isLoggedIn = async (
  req: Request | IncomingMessage,
  res: Response | Record<string, never>,
  next: NextFunction | ((err?: ExtendedError | undefined) => void)
) => {
  if (req.session?.loggedIn && req.session.userId) {
    const user = await getUserById(req.session.userId);
    if (!user) return res.status(409).json({ message: "Gebruiker is verwijderd." });
    req.session.user = user;
    return next();
  }
  if (res.status) res.status(401).json({ message: "Gelieve u eerst in te loggen." });
  return;
};

export default isLoggedIn;
