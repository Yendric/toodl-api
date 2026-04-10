import welcomeMail from "@/mail/emails/welcomeMail";
import prisma from "@/prisma";
import { getUserByEmail } from "@/utils/database";
import { error } from "@/utils/logging";
import bcrypt from "bcryptjs";
import { Request as ExRequest } from "express";
import { OAuth2Client } from "google-auth-library";
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  Route,
  TsoaResponse,
  Tags,
} from "tsoa";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface LoginRequest {
  /**
   * @minLength 3
   * @maxLength 50
   * @format email
   */
  email: string;
  /**
   * @minLength 8
   * @maxLength 50
   */
  password: string;
}

interface RegisterRequest {
  /**
   * @minLength 1
   * @maxLength 50
   */
  username: string;
  /**
   * @minLength 3
   * @maxLength 50
   * @format email
   */
  email: string;
  /**
   * @minLength 8
   * @maxLength 50
   */
  password: string;
}

interface GoogleLoginRequest {
  token: string;
}

interface AuthResponse {
  message: string;
}

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
  @Post("login")
  public async login(
    @Request() request: ExRequest,
    @Body() body: LoginRequest,
  ): Promise<AuthResponse> {
    const user = await getUserByEmail(body.email);

    if (user?.password && (await bcrypt.compare(body.password, user.password))) {
      request.session.loggedIn = true;
      request.session.userId = user.id;

      return { message: "Succesvol ingelogd." };
    }
    this.setStatus(400);
    return { message: "Incorrecte gegevens." };
  }

  @Post("register")
  public async register(
    @Request() request: ExRequest,
    @Body() body: RegisterRequest,
  ): Promise<AuthResponse> {
    const oldUser = await getUserByEmail(body.email);
    if (oldUser) {
      this.setStatus(409);
      return { message: "E-mail is reeds geregistreerd." };
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email.toLowerCase(),
        password: passwordHash,
      },
    });

    request.session.loggedIn = true;
    request.session.userId = user.id;

    welcomeMail(user);

    this.setStatus(201);
    return { message: "Succesvol geregistreerd." };
  }

  @Get("logout")
  public async logout(
    @Request() request: ExRequest,
    @Res() successRes: TsoaResponse<200, AuthResponse>,
    @Res() errorRes: TsoaResponse<500, AuthResponse>,
  ): Promise<void> {
    return new Promise((resolve) => {
      request.session.destroy((err) => {
        if (err) {
          error("Fout bij uitloggen: " + err);
          errorRes(500, { message: "Er ging iets fout bij het uitloggen." });
          return resolve();
        }
        this.setHeader(
          "Set-Cookie",
          "toodl_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly",
        );
        successRes(200, { message: "Succesvol uitgelogd." });
        resolve();
      });
    });
  }

  @Post("google")
  public async google(
    @Request() request: ExRequest,
    @Body() body: GoogleLoginRequest,
  ): Promise<AuthResponse> {
    const ticket = await client.verifyIdToken({
      idToken: body.token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.name) {
      this.setStatus(500);
      return { message: "Er is iets foutgegaan." };
    }

    let user = await getUserByEmail(payload.email);
    if (!user) {
      user = await prisma.user.create({ data: { email: payload.email, username: payload.name } });
      welcomeMail(user);
    }

    request.session.loggedIn = true;
    request.session.userId = user.id;

    this.setStatus(201);
    return { message: "Google login/register succesvol." };
  }
}
