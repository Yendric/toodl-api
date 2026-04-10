import removalMail from "@/mail/emails/removalMail";
import prisma from "@/prisma";
import { getAuthenticatedUser, getAuthenticatedUserId } from "@/utils/auth";
import bcrypt from "bcryptjs";
import { Request as ExRequest } from "express";
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Request,
  Res,
  Route,
  Security,
  TsoaResponse,
  Tags,
} from "tsoa";

interface UserInfoResponse {
  email: string;
  username: string;
  onlyLinked: boolean;
  dailyNotification: boolean;
  reminderNotification: boolean;
  nowNotification: boolean;
  icalUrls: string[];
}

interface UserUpdateRequest {
  /**
   * @minLength 3
   * @maxLength 50
   * @format email
   */
  email: string;
  /**
   * @minLength 1
   * @maxLength 50
   */
  username: string;
  /**
   * @maxItems 10
   */
  icalUrls: string[];
  dailyNotification: boolean;
  reminderNotification: boolean;
  nowNotification: boolean;
}

interface PasswordUpdateRequest {
  /**
   * @minLength 8
   * @maxLength 50
   */
  newPassword: string;
  /**
   * @minLength 8
   * @maxLength 50
   */
  confirmPassword: string;
  /**
   * @minLength 8
   * @maxLength 50
   */
  oldPassword?: string;
}

interface MessageResponse {
  message: string;
}

@Route("auth/user_data")
@Tags("User")
@Security("session")
export class UserController extends Controller {
  @Get("/")
  public async info(@Request() request: ExRequest): Promise<UserInfoResponse> {
    const user = getAuthenticatedUser(request);

    return {
      email: user.email,
      username: user.username,
      onlyLinked: !user.password,
      dailyNotification: user.dailyNotification,
      reminderNotification: user.reminderNotification,
      nowNotification: user.nowNotification,
      icalUrls: user.icalUrls,
    };
  }

  @Post("/")
  public async update(
    @Request() request: ExRequest,
    @Body() body: UserUpdateRequest,
  ): Promise<MessageResponse> {
    const userId = getAuthenticatedUserId(request);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...body,
        email: body.email.toLowerCase(),
      },
    });

    return { message: "Gebruiker succesvol geüpdatet." };
  }

  @Post("destroy")
  public async destroy(
    @Request() request: ExRequest,
    @Res() successRes: TsoaResponse<200, MessageResponse>,
  ): Promise<void> {
    const user = getAuthenticatedUser(request);

    await prisma.user.delete({ where: { id: user.id } });

    removalMail(user);

    return new Promise((resolve) => {
      request.session.destroy(() => {
        this.setHeader(
          "Set-Cookie",
          "toodl_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly",
        );
        successRes(200, { message: "Gebruiker succesvol verwijderd." });
        resolve();
      });
    });
  }

  @Post("update_password")
  public async updatePassword(
    @Request() request: ExRequest,
    @Body() body: PasswordUpdateRequest,
  ): Promise<MessageResponse> {
    const user = getAuthenticatedUser(request);

    if (!user.password) {
      if (!body.newPassword || !body.confirmPassword) {
        this.setStatus(400);
        return { message: "Geef alle gegevens mee." };
      }
      if (body.newPassword != body.confirmPassword) {
        this.setStatus(400);
        return { message: "Wachtwoorden komen niet overeen." };
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await bcrypt.hash(body.newPassword, 10),
        },
      });

      return { message: "Gebruiker succesvol geüpdatet." };
    } else if (body.oldPassword) {
      if (body.newPassword != body.confirmPassword) {
        this.setStatus(400);
        return { message: "Wachtwoordbevestiging incorrect." };
      }
      if (!(await bcrypt.compare(body.oldPassword, user.password))) {
        this.setStatus(400);
        return { message: "Geef je juiste wachtwoord mee." };
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await bcrypt.hash(body.newPassword, 10),
        },
      });

      return { message: "Gebruiker succesvol geüpdatet." };
    } else {
      this.setStatus(400);
      return { message: "Geef je juiste wachtwoord mee." };
    }
  }
}
