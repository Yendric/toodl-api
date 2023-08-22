import removalMail from "@/mail/emails/removalMail";
import prisma from "@/prisma";
import { getAuthenticatedUser, getAuthenticatedUserId } from "@/utils/auth";
import { zParse } from "@/utils/validation";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { z } from "zod";

export async function info(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);

  res.status(200).json({
    email: user.email,
    username: user.username,
    onlyLinked: !user.password,
    dailyNotification: user.dailyNotification,
    reminderNotification: user.reminderNotification,
    nowNotification: user.nowNotification,
    icalUrls: user.icalUrls,
  });
}

export async function update(req: Request, res: Response) {
  const { body } = await zParse(
    z.object({
      body: z.object({
        email: z.string().email().min(3).max(50).toLowerCase(),
        username: z.string().min(1).max(50),
        icalUrls: z.array(z.string().url()).max(10).default([]),
        dailyNotification: z.boolean(),
        reminderNotification: z.boolean(),
        nowNotification: z.boolean(),
      }),
    }),
    req,
  );
  const userId = getAuthenticatedUserId(req);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: body,
  });

  return res.status(200).json({ message: "Gebruiker succesvol geüpdatet." });
}

export async function destroy(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);

  await prisma.user.delete({ where: { id: user.id } });

  removalMail(user);

  return req.session.destroy(() => {
    return res.status(200).json({ message: "Gebruiker succesvol verwijderd." });
  });
}

export async function updatePassword(req: Request, res: Response) {
  const { body } = await zParse(
    z.object({
      body: z.object({
        newPassword: z.string().min(8).max(50),
        confirmPassword: z.string().min(8).max(50),
        oldPassword: z.string().min(8).max(50).optional(),
      }),
    }),
    req,
  );

  const user = getAuthenticatedUser(req);

  if (!user.password) {
    // Gebruiker heeft geen wachtwoord en kan momenteel dus enkel met SSO aanmelden
    if (!body.newPassword || !body.confirmPassword) return res.status(400).json({ message: "Geef alle gegevens mee." });
    if (body.newPassword != body.confirmPassword)
      return res.status(400).json({ message: "Wachtwoorden komen niet overeen." });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(body.newPassword, 10),
      },
    });

    return res.status(200).json({ message: "Gebruiker succesvol geüpdatet." });
  } else if (body.oldPassword) {
    if (body.newPassword != body.confirmPassword)
      return res.status(400).json({ message: "Wachtwoordbevestiging incorrect." });
    if (!(await bcrypt.compare(body.oldPassword, user.password)) || body.newPassword != body.confirmPassword)
      return res.status(400).json({ message: "Geef je juiste wachtwoord mee." });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(body.newPassword, 10),
      },
    });

    return res.status(200).json({ message: "Gebruiker succesvol geüpdatet." });
  } else {
    return res.status(400).json({ message: "Geef je juiste wachtwoord mee." });
  }
}
