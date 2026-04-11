import { DatabaseLimitError } from "#/errors/DatabaseLimitError.js";
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
  },
}));

describe("TodoService", () => {
  let todoService: TodoService;

  beforeEach(() => {
    vi.clearAllMocks();
    todoService = new TodoService();
  });

  describe("create", () => {
    const userId = 1;
    const todoData = { subject: "Test Todo", listId: 10 };

    it("should create a todo if list exists and under limit", async () => {
      (prisma.list.findFirst as Mock).mockResolvedValue({ id: 10, userId });
      (prisma.todo.count as Mock).mockResolvedValue(50);
      (prisma.todo.findFirst as Mock).mockResolvedValue({ position: "a0" });
      (prisma.todo.create as Mock).mockResolvedValue({ id: 100, ...todoData, position: "a1" });

      const result = await todoService.create(userId, todoData);

      expect(prisma.list.findFirst).toHaveBeenCalledWith({ where: { id: 10, userId } });
      expect(prisma.todo.count).toHaveBeenCalledWith({ where: { listId: 10 } });
      expect(prisma.todo.findFirst).toHaveBeenCalledWith({
        where: { userId, listId: 10 },
        orderBy: { position: "desc" },
      });
      expect(prisma.todo.create).toHaveBeenCalled();
      // Ensure position property is added properly
      expect((prisma.todo.create as Mock).mock.calls[0]![0].data).toHaveProperty("position");
      expect(result.id).toBe(100);
    });

    it("should throw error if list not found for user", async () => {
      (prisma.list.findFirst as Mock).mockResolvedValue(null);

      await expect(todoService.create(userId, todoData)).rejects.toThrow(DataValidationError);
    });

    it("should throw error if list is full (100 todos)", async () => {
      (prisma.list.findFirst as Mock).mockResolvedValue({ id: 10, userId });
      (prisma.todo.count as Mock).mockResolvedValue(100);

      await expect(todoService.create(userId, todoData)).rejects.toThrow(DatabaseLimitError);
    });
  });
});
