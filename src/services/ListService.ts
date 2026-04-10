import prisma from "@/prisma";
import { DatabaseLimitError } from "@/errors/DatabaseLimitError";

export class ListService {
  public static async listForUser(userId: number) {
    return await prisma.list.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  }

  public static async create(userId: number, data: any) {
    const amount = await prisma.list.count({
      where: { userId },
    });
    if (amount >= 10) {
      throw new DatabaseLimitError("Je mag maximaal 10 lijsten hebben.");
    }

    return await prisma.list.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  public static async update(userId: number, listId: number, data: any) {
    return await prisma.list.update({
      data,
      where: { id: listId, userId },
    });
  }

  public static async delete(userId: number, listId: number) {
    const amount = await prisma.list.count({
      where: { userId },
    });
    if (amount <= 1) {
      throw new DatabaseLimitError("Je moet minimaal 1 lijst hebben.");
    }

    return await prisma.list.delete({ where: { id: listId, userId } });
  }
}
