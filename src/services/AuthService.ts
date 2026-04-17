import { ToodlError } from "#/errors/ToodlError.js";
import { type User } from "#/generated/prisma/client.js";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { injectable } from "inversify";
import { MailService } from "./MailService.js";
import { UserService } from "./UserService.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface IAuthService {
  register(username: string, email: string, password: string): Promise<User>;
  login(email: string, password: string): Promise<User>;
  google(token: string): Promise<User>;
}

@injectable()
export class AuthService implements IAuthService {
  constructor(
    private userService: UserService,
    private mailService: MailService,
  ) {}

  public async register(username: string, email: string, password: string): Promise<User> {
    const oldUser = await this.userService.getUserByEmail(email);
    if (oldUser) {
      throw new ToodlError("E-mail is reeds geregistreerd.", "ConflictError", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userService.createUserWithDefaults({
      username,
      email: email.toLowerCase(),
      password: passwordHash,
    });

    await this.mailService.sendWelcomeMail(user);
    return user;
  }

  public async login(email: string, password: string): Promise<User> {
    const user = await this.userService.getUserByEmail(email);

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

    const user = await this.userService.getUserByEmail(payload.email);
    if (!user) {
      const newUser = await this.userService.createUserWithDefaults({
        email: payload.email.toLowerCase(),
        username: payload.name,
      });
      await this.mailService.sendWelcomeMail(newUser);
      return newUser;
    }

    return user;
  }
}
