import { DataValidationError } from "#/errors/DataValidationError.js";
import { DatabaseLimitError } from "#/errors/DatabaseLimitError.js";
import { Prisma, type Todo } from "#/generated/prisma/client.js";
import prisma from "#/prisma.js";
import dayjs from "dayjs";
import { generateKeyBetween } from "fractional-indexing";

export type TodoCreateData = Partial<
  Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt" | "startTime" | "endTime">
> & {
  subject: string;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  categoryId?: number | null;
};

export interface ITodoService {
  listForUser(userId: number, storeId?: number): Promise<Todo[]>;
  listByList(userId: number, listId: number, storeId?: number): Promise<Todo[]>;
  create(userId: number, data: TodoCreateData): Promise<Todo>;
  update(userId: number, todoId: number, data: Partial<TodoCreateData>): Promise<Todo>;
  delete(userId: number, todoId: number): Promise<Todo>;
}

import { injectable } from "inversify";

@injectable()
export class TodoService implements ITodoService {
  public async listForUser(userId: number, storeId?: number): Promise<Todo[]> {
    let storeOrderMap: Map<number, number> | undefined;

    if (storeId) {
      const store = await prisma.store.findFirst({
        where: { id: storeId, userId },
        include: { categoryOrders: true },
      });
      if (!store) throw new DataValidationError("Winkel niet gevonden.");
      storeOrderMap = new Map(store.categoryOrders.map((o) => [o.categoryId, o.position]));
    }

    const todos = await prisma.todo.findMany({
      where: { userId },
      orderBy: [{ done: "asc" }, { position: "asc" }, { startTime: "asc" }],
    });

    return storeOrderMap ? this.sortTodosByStoreMap(todos, storeOrderMap) : todos;
  }

  public async listByList(userId: number, listId: number, storeId?: number): Promise<Todo[]> {
    let storeOrderMap: Map<number, number> | undefined;

    if (storeId) {
      const store = await prisma.store.findFirst({
        where: { id: storeId, userId },
        include: { categoryOrders: true },
      });
      if (!store) throw new DataValidationError("Winkel niet gevonden.");
      storeOrderMap = new Map(store.categoryOrders.map((o) => [o.categoryId, o.position]));
    }

    const todos = await prisma.todo.findMany({
      where: { userId, listId },
      orderBy: [{ done: "asc" }, { position: "asc" }, { startTime: "asc" }],
    });

    return storeOrderMap ? this.sortTodosByStoreMap(todos, storeOrderMap) : todos;
  }

  private sortTodosByStoreMap(todos: Todo[], orderMap: Map<number, number>): Todo[] {
    return todos.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;

      const orderA = a.categoryId !== null ? (orderMap.get(a.categoryId) ?? Infinity) : Infinity;
      const orderB = b.categoryId !== null ? (orderMap.get(b.categoryId) ?? Infinity) : Infinity;

      if (orderA !== orderB) return orderA - orderB;

      return a.position.localeCompare(b.position);
    });
  }

  public async create(userId: number, data: TodoCreateData): Promise<Todo> {
    const { startTime, endTime, listId, categoryId, ...rest } = data;
    const finalStartTime = startTime ? new Date(startTime) : new Date();
    const finalEndTime = endTime ? new Date(endTime) : dayjs(finalStartTime).add(1, "hour").toDate();

    if (listId) {
      const list = await prisma.list.findFirst({
        where: { id: listId, userId },
        select: { id: true, _count: { select: { todos: true } } },
      });
      if (!list) throw new DataValidationError("Lijst niet gevonden.");

      if (list._count.todos >= 100) {
        throw new DatabaseLimitError("Je kan maximaal 100 todos per lijst hebben.");
      }
    }

    if (categoryId) {
      const categoryCount = await prisma.category.count({
        where: { id: categoryId, userId },
      });
      if (categoryCount === 0) throw new DataValidationError("Categorie niet gevonden.");
    }

    let finalPosition = rest.position;
    if (!finalPosition) {
      const lastTodo = await prisma.todo.findFirst({
        where: { userId, listId: listId || null },
        orderBy: { position: "desc" },
        select: { position: true },
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
        categoryId,
        userId,
      },
    });
  }

  public async update(userId: number, todoId: number, data: Partial<TodoCreateData>): Promise<Todo> {
    const { startTime, endTime, listId, categoryId, ...rest } = data;
    const updateData: Prisma.TodoUpdateInput = { ...rest };

    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);

    if (listId !== undefined) {
      if (listId === null) {
        updateData.list = { disconnect: true };
      } else {
        const listCount = await prisma.list.count({
          where: { id: listId, userId },
        });
        if (listCount === 0) throw new DataValidationError("Lijst niet gevonden.");
        updateData.list = { connect: { id: listId } };
      }
    }

    if (categoryId !== undefined) {
      if (categoryId === null) {
        updateData.category = { disconnect: true };
      } else {
        const categoryCount = await prisma.category.count({
          where: { id: categoryId, userId },
        });
        if (categoryCount === 0) throw new DataValidationError("Categorie niet gevonden.");
        updateData.category = { connect: { id: categoryId } };
      }
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
