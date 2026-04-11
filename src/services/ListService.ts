import prisma from "@/prisma";
import { DatabaseLimitError } from "@/errors/DatabaseLimitError";
import { List } from "@prisma/client";

export interface IListService {
  listForUser(userId: number): Promise<List[]>;
  create(userId: number, data: Pick<List, "name" | "color">): Promise<List>;
  update(userId: number, listId: number, data: Partial<Pick<List, "name" | "color">>): Promise<List>;
  delete(userId: number, listId: number): Promise<List>;
}

export class ListService implements IListService {
  public async listForUser(userId: number): Promise<List[]> {
    return await prisma.list.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  }

  public async create(userId: number, data: Pick<List, "name" | "color">): Promise<List> {
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

  public async update(userId: number, listId: number, data: Partial<Pick<List, "name" | "color">>): Promise<List> {
    return await prisma.list.update({
      data,
      where: { id: listId, userId },
    });
  }

  public async delete(userId: number, listId: number): Promise<List> {
    const amount = await prisma.list.count({
      where: { userId },
    });
    if (amount <= 1) {
      throw new DatabaseLimitError("Je moet minimaal 1 lijst hebben.");
    }

    return await prisma.list.delete({ where: { id: listId, userId } });
  }
}
