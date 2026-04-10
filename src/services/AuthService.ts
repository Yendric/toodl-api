import welcomeMail from "@/mail/emails/welcomeMail";
import prisma from "@/prisma";
import { getUserByEmail } from "@/utils/database";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { ToodlError } from "@/errors/ToodlError";
import { UserService } from "./UserService";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  public static async register(username: string, email: string, password: string) {
    const oldUser = await getUserByEmail(email);
    if (oldUser) {
      throw new ToodlError("E-mail is reeds geregistreerd.", "ConflictError", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        password: passwordHash,
      },
    });

    await UserService.createDefaults(user.id);
    welcomeMail(user);
    return user;
  }

  public static async login(email: string, password: string) {
    const user = await getUserByEmail(email);

    if (user?.password && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    
    throw new ToodlError("Incorrecte gegevens.", "UnauthorizedError", 400);
  }

  public static async google(token: string) {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.name) {
      throw new ToodlError("Er is iets foutgegaan met Google login.", "InternalError", 500);
    }

    let user = await getUserByEmail(payload.email);
    if (!user) {
      user = await prisma.user.create({ data: { email: payload.email, username: payload.name } });
      await UserService.createDefaults(user.id);
      welcomeMail(user);
    }

    return user;
  }
}
