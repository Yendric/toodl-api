import welcomeMail from "@/mail/emails/welcomeMail";
import prisma from "@/prisma";
import { getUserByEmail } from "@/utils/database";
import { error } from "@/utils/logging";
import { zParse } from "@/utils/validation";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function login(req: Request, res: Response) {
  const { body } = await zParse(
    z.object({
      body: z.object({
        email: z.string().email().min(3).max(50),
        password: z.string().min(8).max(50),
      }),
    }),
    req,
  );

  const user = await getUserByEmail(body.email);

  if (user?.password && (await bcrypt.compare(body.password, user.password))) {
    req.session.loggedIn = true;
    req.session.userId = user.id;

    return res.status(200).json({ message: "Succesvol ingelogd." });
  }
  return res.status(400).json({ message: "Incorrecte gegevens." });
}

export async function register(req: Request, res: Response) {
  const { body } = await zParse(
    z.object({
      body: z.object({
        username: z.string().min(1).max(50),
        email: z.string().email().min(3).max(50),
        password: z.string().min(8).max(50),
      }),
    }),
    req,
  );

  const oldUser = await getUserByEmail(body.email);
  if (oldUser) return res.status(409).json({ message: "E-mail is reeds geregistreerd." });

  const passwordHash = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      username: body.username,
      email: body.email.toLowerCase(),
      password: passwordHash,
    },
  });

  req.session.loggedIn = true;
  req.session.userId = user.id;

  welcomeMail(user);

  return res.status(201).json({ message: "Succesvol geregistreerd." });
}

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
  if (!user) {
    user = await prisma.user.create({ data: { email: payload.email, username: payload.name } });
    welcomeMail(user);
  }

  req.session.loggedIn = true;
  req.session.userId = user.id;

  res.status(201).json({ message: "Google login/register succesvol." });
}
