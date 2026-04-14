import { DataValidationError } from "#/errors/DataValidationError.js";
import prisma from "#/prisma.js";
import { TodoService } from "#/services/TodoService.js";
import { type Mock, vi } from "vitest";

vi.mock("#/prisma.js", () => ({
  default: {
    todo: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    list: {
      findFirst: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
    store: {
      findFirst: vi.fn(),
    },
    storeCategoryOrder: {
      findMany: vi.fn(),
    },
  },
}));

describe("TodoService", () => {
  let todoService: TodoService;

  beforeEach(() => {
    vi.clearAllMocks();
    todoService = new TodoService();
  });

  describe("listForUser", () => {
    const userId = 1;
    it("should return sorted todos without storeId", async () => {
      const mockTodos = [{ id: 1, subject: "Todo 1", done: false, position: "a0", categoryId: null }];
      (prisma.todo.findMany as Mock).mockResolvedValue(mockTodos);

      const result = await todoService.listForUser(userId);

      expect(prisma.todo.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockTodos);
    });

    it("should return sorted todos with storeId", async () => {
      const mockTodos = [
        { id: 1, subject: "Todo 1", done: false, position: "a0", categoryId: 1 },
        { id: 2, subject: "Todo 2", done: false, position: "a1", categoryId: 2 },
      ];
      (prisma.todo.findMany as Mock).mockResolvedValue(mockTodos);
      (prisma.store.findFirst as Mock).mockResolvedValue({ id: 100, userId });
      (prisma.storeCategoryOrder.findMany as Mock).mockResolvedValue([
        { categoryId: 2, position: 0 },
        { categoryId: 1, position: 1 },
      ]);

      const result = await todoService.listForUser(userId, 100);

      expect(result?.[0]?.id).toBe(2);
      expect(result?.[1]?.id).toBe(1);
    });

    it("should throw error if store not found", async () => {
      (prisma.todo.findMany as Mock).mockResolvedValue([]);
      (prisma.store.findFirst as Mock).mockResolvedValue(null);

      await expect(todoService.listForUser(userId, 100)).rejects.toThrow(DataValidationError);
    });
  });

  describe("create", () => {
    const userId = 1;
    const todoData = { subject: "Test Todo", listId: 10, categoryId: 5 };

    it("should create a todo if list and category exist", async () => {
      (prisma.list.findFirst as Mock).mockResolvedValue({ id: 10, userId });
      (prisma.category.findFirst as Mock).mockResolvedValue({ id: 5, userId });
      (prisma.todo.count as Mock).mockResolvedValue(50);
      (prisma.todo.findFirst as Mock).mockResolvedValue({ position: "a0" });
      (prisma.todo.create as Mock).mockResolvedValue({ id: 100, ...todoData, position: "a1" });

      const result = await todoService.create(userId, todoData);

      expect(prisma.list.findFirst).toHaveBeenCalledWith({ where: { id: 10, userId } });
      expect(prisma.category.findFirst).toHaveBeenCalledWith({ where: { id: 5, userId } });
      expect(result.id).toBe(100);
    });

    it("should throw error if category not found for user", async () => {
      (prisma.list.findFirst as Mock).mockResolvedValue({ id: 10, userId });
      (prisma.category.findFirst as Mock).mockResolvedValue(null);

      await expect(todoService.create(userId, todoData)).rejects.toThrow(DataValidationError);
    });
  });

  describe("update", () => {
    const userId = 1;
    const todoId = 100;

    it("should allow setting listId to null", async () => {
      (prisma.todo.update as Mock).mockResolvedValue({ id: todoId });

      await todoService.update(userId, todoId, { listId: null });

      expect(prisma.todo.update).toHaveBeenCalledWith({
        data: expect.objectContaining({
          list: { disconnect: true },
        }),
        where: { id: todoId, userId },
      });
    });

    it("should verify list ownership when updating listId", async () => {
      (prisma.list.findFirst as Mock).mockResolvedValue(null);

      await expect(todoService.update(userId, todoId, { listId: 20 })).rejects.toThrow(DataValidationError);
    });
  });
});
