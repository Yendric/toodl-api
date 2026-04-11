import welcomeMail from "@/mail/emails/welcomeMail";
import prisma from "@/prisma";
import { getUserByEmail } from "@/utils/database";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { ToodlError } from "@/errors/ToodlError";
import { IUserService } from "./UserService";
import { User } from "@prisma/client";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface IAuthService {
  register(username: string, email: string, password: string): Promise<User>;
  login(email: string, password: string): Promise<User>;
  google(token: string): Promise<User>;
}

export class AuthService implements IAuthService {
  constructor(private userService: IUserService) {}

  public async register(username: string, email: string, password: string): Promise<User> {
    const oldUser = await getUserByEmail(email);
    if (oldUser) {
      throw new ToodlError("E-mail is reeds geregistreerd.", "ConflictError", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userService.createUserWithDefaults({
      username,
      email: email.toLowerCase(),
      password: passwordHash,
    });

    welcomeMail(user);
    return user;
  }

  public async login(email: string, password: string): Promise<User> {
    const user = await getUserByEmail(email);

    if (user?.password && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    throw new ToodlError("Incorrecte gegevens.", "UnauthorizedError", 400);
  }

  public async google(token: string): Promise<User> {
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
      const newUser = await this.userService.createUserWithDefaults({ email: payload.email.toLowerCase(), username: payload.name });
      welcomeMail(newUser);
      return newUser;
    }

    return user;
  }
}
