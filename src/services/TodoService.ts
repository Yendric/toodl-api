import { DataValidationError } from "#/errors/DataValidationError.js";
import { DatabaseLimitError } from "#/errors/DatabaseLimitError.js";
import prisma from "#/prisma.js";
import { Prisma, type Todo } from "@prisma/client";
import dayjs from "dayjs";
import { generateKeyBetween } from "fractional-indexing";

export type TodoCreateData = Partial<
  Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt" | "startTime" | "endTime">
> & {
  subject: string;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
};

export interface ITodoService {
  listForUser(userId: number): Promise<Todo[]>;
  create(userId: number, data: TodoCreateData): Promise<Todo>;
  update(userId: number, todoId: number, data: Partial<TodoCreateData>): Promise<Todo>;
  delete(userId: number, todoId: number): Promise<Todo>;
}

export class TodoService implements ITodoService {
  public async listForUser(userId: number): Promise<Todo[]> {
    return await prisma.todo.findMany({
      where: { userId },
      orderBy: [{ done: "asc" }, { position: "asc" }, { startTime: "asc" }],
    });
  }

  public async create(userId: number, data: TodoCreateData): Promise<Todo> {
    const { startTime, endTime, listId, ...rest } = data;
    const finalStartTime = startTime ? new Date(startTime) : new Date();
    const finalEndTime = endTime ? new Date(endTime) : dayjs(finalStartTime).add(1, "hour").toDate();

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

    let finalPosition = rest.position;
    if (!finalPosition) {
      const lastTodo = await prisma.todo.findFirst({
        where: { userId, listId: listId || null },
        orderBy: { position: "desc" },
      });
      finalPosition = generateKeyBetween(lastTodo?.position || null, null);
    }

    return await prisma.todo.create({
      data: {
        ...rest,
        position: finalPosition,
        startTime: finalStartTime,
        endTime: finalEndTime,
        listId,
        userId,
      },
    });
  }

  public async update(userId: number, todoId: number, data: Partial<TodoCreateData>): Promise<Todo> {
    const { startTime, endTime, listId, ...rest } = data;
    const updateData: Prisma.TodoUpdateInput = { ...rest };

    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);

    if (listId) {
      const list = await prisma.list.findFirst({
        where: { id: listId, userId },
      });
      if (!list) throw new DataValidationError("Lijst niet gevonden.");
      updateData.list = { connect: { id: listId } };
    }

    return await prisma.todo.update({
      data: updateData,
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
