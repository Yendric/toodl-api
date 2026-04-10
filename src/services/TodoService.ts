import prisma from "@/prisma";
import { DataValidationError } from "@/errors/DataValidationError";
import { DatabaseLimitError } from "@/errors/DatabaseLimitError";
import dayjs from "dayjs";
import { Todo } from "@prisma/client";

export interface ITodoService {
  listForUser(userId: number): Promise<Todo[]>;
  create(userId: number, data: any): Promise<Todo>;
  update(userId: number, todoId: number, data: any): Promise<Todo>;
  delete(userId: number, todoId: number): Promise<Todo>;
}

export class TodoService implements ITodoService {
  public async listForUser(userId: number): Promise<Todo[]> {
    return await prisma.todo.findMany({
      where: { userId },
      orderBy: [{ done: "asc" }, { startTime: "asc" }],
    });
  }

  public async create(userId: number, data: any): Promise<Todo> {
    let { startTime, endTime, listId, ...rest } = data;
    startTime = startTime ? new Date(startTime) : new Date();
    endTime = endTime ? new Date(endTime) : dayjs(startTime).add(1, "hour").toDate();

    if (listId) {
      const list = await prisma.list.findFirst({
        where: { id: listId, userId },
      });
      if (!list) throw new DataValidationError("Lijst niet gevonden.");

      const amount = await prisma.todo.count({
        where: { listId },
      });
      if (amount >= 100) {
        throw new DatabaseLimitError("Je kan maximaal 100 todos per lijst hebben.");
      }
    }

    return await prisma.todo.create({
      data: {
        ...rest,
        startTime,
        endTime,
        listId,
        userId,
      },
    });
  }

  public async update(userId: number, todoId: number, data: any): Promise<Todo> {
    let { startTime, endTime, listId, ...rest } = data;
    if (startTime) startTime = new Date(startTime);
    if (endTime) endTime = new Date(endTime);

    if (listId) {
      const list = await prisma.list.findFirst({
        where: { id: listId, userId },
      });
      if (!list) throw new DataValidationError("Lijst niet gevonden.");
    }

    return await prisma.todo.update({
      data: {
        ...rest,
        startTime,
        endTime,
        listId,
      },
      where: {
        id: todoId,
        userId: userId,
      },
    });
  }

  public async delete(userId: number, todoId: number): Promise<Todo> {
    return await prisma.todo.delete({
      where: {
        id: todoId,
        userId,
      },
    });
  }
}
