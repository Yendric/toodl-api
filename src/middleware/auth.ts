import { getUserById } from "@/utils/database";
import { NextFunction, Request, Response } from "express";

async function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  if (req.session?.loggedIn && req.session.userId) {
    const user = await getUserById(req.session.userId);

    if (!user) {
      // Gebruiker bestaat niet meer, uitloggen
      return req.session.destroy((_) => {
        res.clearCookie("toodl_session");
        return res.status(200).json({ message: "Gebruiker is verwijderd. U bent nu uitgelogd." });
      });
    }

    req.session.user = user;
    return next();
  }

  return res.status(401).json({ message: "Gelieve u eerst in te loggen." });
}

export default isLoggedIn;
