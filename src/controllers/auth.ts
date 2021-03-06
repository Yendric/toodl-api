import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { Request, Response } from "express";
import { body } from "express-validator";
import { getUserByEmail } from "@/utils/database";
import Users from "@/models/User";
import { error } from "@/utils/logging";
import validate from "@/middleware/validation";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const login = [
  body("email").isEmail(),
  body("password").isLength({ min: 8, max: 50 }),
  validate,
  async function (req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);

    if (user?.password && (await bcrypt.compare(password, user.password))) {
      req.session.loggedIn = true;
      req.session.userId = user.id;

      return res.status(200).json({ message: "Succesvol ingelogd." });
    }
    return res.status(400).json({ message: "Incorrecte gegevens." });
  },
];

export const register = [
  body("email").isEmail().isLength({ max: 50 }),
  body("password").isLength({ min: 8, max: 50 }),
  body("username").isLength({ min: 1, max: 50 }),
  validate,
  async function (req: Request, res: Response) {
    const { username, email, password } = req.body;

    const oldUser = await getUserByEmail(email);
    if (oldUser) return res.status(409).json({ message: "E-mail is reeds geregistreerd." });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await Users.create({
      username,
      email: email.toLowerCase(),
      password: passwordHash,
    });

    req.session.loggedIn = true;
    req.session.userId = user.id;

    return res.status(201).json({ message: "Succesvol geregistreerd." });
  },
];

export async function logout(req: Request, res: Response) {
  return req.session.destroy((err) => {
    if (err) {
      error("Fout bij uitloggen: " + err);
      return res.status(500).json({ message: "Er ging iets fout bij het uitloggen." });
    }
    res.clearCookie("toodl_session");
    return res.status(200).json({ message: "Succesvol uitgelogd." });
  });
}

export async function google(req: Request, res: Response) {
  const { token } = req.body;

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.name) return res.status(500).json({ message: "Er is iets foutgegaan." });

  let user = await getUserByEmail(payload.email);
  if (!user) user = await Users.create({ email: payload.email, username: payload.name });

  req.session.loggedIn = true;
  req.session.userId = user.id;

  res.status(201).json({ message: "Google login/register succesvol." });
}
