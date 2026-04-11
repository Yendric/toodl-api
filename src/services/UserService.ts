import { ToodlError } from "#/errors/ToodlError.js";
import removalMail from "#/mail/emails/removalMail.js";
import prisma from "#/prisma.js";
import { Prisma, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";

export interface UserUpdateData {
  email?: string;
  username?: string;
  dailyNotification?: boolean;
  reminderNotification?: boolean;
  nowNotification?: boolean;
  icalUrls?: string[];
}

export interface PasswordUpdateData {
  newPassword: string;
  confirmPassword: string;
  oldPassword?: string;
}

export interface IUserService {
  createUserWithDefaults(data: Prisma.UserCreateInput): Promise<User>;
  update(userId: number, data: UserUpdateData): Promise<User>;
  delete(user: User): Promise<void>;
  updatePassword(user: User, data: PasswordUpdateData): Promise<void>;
}

export class UserService implements IUserService {
  public async createUserWithDefaults(data: Prisma.UserCreateInput): Promise<User> {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data });

      const boodschappen = await tx.list.create({
        data: {
          userId: user.id,
          name: "Boodschappen",
          color: "#33AAFF",
        },
      });

      await tx.todo.create({
        data: {
          userId: user.id,
          listId: boodschappen.id,
          subject: "Klik op de checkbox om de todo als klaar te markeren",
        },
      });

      await tx.todo.create({
        data: {
          userId: user.id,
          listId: boodschappen.id,
          startTime: new Date(),
          endTime: dayjs(new Date()).add(1, "hour").toDate(),
          subject: "Maak extra lijstjes met behulp van de linker zijbalk",
        },
      });

      const planning = await tx.list.create({
        data: {
          userId: user.id,
          name: "Planning",
          color: "#FF0000",
        },
      });

      await tx.todo.create({
        data: {
          userId: user.id,
          listId: planning.id,
          startTime: new Date(),
          enableDeadline: true,
          endTime: dayjs(new Date()).add(1, "hour").toDate(),
          subject: "Maak todos met datum & tijd en bekijk ze in de planningweergave bovenaan",
        },
      });

      return user;
    });
  }

  public async update(userId: number, data: UserUpdateData): Promise<User> {
    const { email, ...rest } = data;
    return await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...rest,
        email: email ? email.toLowerCase() : undefined,
      },
    });
  }

  public async delete(user: User): Promise<void> {
    await prisma.user.delete({ where: { id: user.id } });
    await removalMail(user);
  }

  public async updatePassword(user: User, data: PasswordUpdateData): Promise<void> {
    const { newPassword, confirmPassword, oldPassword } = data;

    if (newPassword !== confirmPassword) {
      throw new ToodlError("Wachtwoorden komen niet overeen.", "BadRequestError", 400);
    }

    if (!user.password) {
      // Gebruiker heeft geen wachtwoord (SSO)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await bcrypt.hash(newPassword, 10),
        },
      });
    } else {
      if (!oldPassword) {
        throw new ToodlError("Geef je juiste wachtwoord mee.", "BadRequestError", 400);
      }

      if (!(await bcrypt.compare(oldPassword, user.password))) {
        throw new ToodlError("Geef je juiste wachtwoord mee.", "BadRequestError", 400);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await bcrypt.hash(newPassword, 10),
        },
      });
    }
  }
}
