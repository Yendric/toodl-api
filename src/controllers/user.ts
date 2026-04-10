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
  Route,
  Security,
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
  email: string;
  username: string;
  icalUrls: string[];
  dailyNotification: boolean;
  reminderNotification: boolean;
  nowNotification: boolean;
}

interface PasswordUpdateRequest {
  newPassword: string;
  confirmPassword: string;
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
      data: body,
    });

    return { message: "Gebruiker succesvol geüpdatet." };
  }

  @Post("destroy")
  public async destroy(@Request() request: ExRequest): Promise<MessageResponse> {
    const user = getAuthenticatedUser(request);

    await prisma.user.delete({ where: { id: user.id } });

    removalMail(user);

    return new Promise((resolve) => {
      request.session.destroy(() => {
        resolve({ message: "Gebruiker succesvol verwijderd." });
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
