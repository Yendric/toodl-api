import dayjs from "dayjs";
import removalMail from "@/mail/emails/removalMail";
import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { ToodlError } from "@/errors/ToodlError";
import { User } from "@prisma/client";

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
  createDefaults(userId: number): Promise<void>;
  update(userId: number, data: UserUpdateData): Promise<User>;
  delete(user: User): Promise<void>;
  updatePassword(user: User, data: PasswordUpdateData): Promise<void>;
}

export class UserService implements IUserService {
  public async createDefaults(userId: number): Promise<void> {
    const boodschappen = await prisma.list.create({
      data: {
        userId,
        name: "Boodschappen",
        color: "#33AAFF",
      },
    });

    await prisma.todo.create({
      data: {
        userId,
        listId: boodschappen.id,
        subject: "Klik op de checkbox om de todo als klaar te markeren",
      },
    });

    await prisma.todo.create({
      data: {
        userId,
        listId: boodschappen.id,
        startTime: new Date(),
        endTime: dayjs(new Date()).add(1, "hour").toDate(),
        subject: "Maak extra lijstjes met behulp van de linker zijbalk",
      },
    });

    const planning = await prisma.list.create({
      data: {
        userId,
        name: "Planning",
        color: "#FF0000",
      },
    });

    await prisma.todo.create({
      data: {
        userId,
        listId: planning.id,
        startTime: new Date(),
        enableDeadline: true,
        endTime: dayjs(new Date()).add(1, "hour").toDate(),
        subject: "Maak todos met datum & tijd en bekijk ze in de planningweergave bovenaan",
      },
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
    removalMail(user);
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
