import prisma from "@/prisma";

export class ListService {
  public static async listForUser(userId: number) {
    return await prisma.list.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  }

  public static async create(userId: number, data: any) {
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
    return await prisma.list.delete({ where: { id: listId, userId } });
  }
}
