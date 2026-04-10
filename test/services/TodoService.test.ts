import { TodoService } from "@/services/TodoService";
import prisma from "@/prisma";
import { DatabaseLimitError } from "@/errors/DatabaseLimitError";
import { DataValidationError } from "@/errors/DataValidationError";

jest.mock("@/prisma", () => ({
  todo: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  list: {
    findFirst: jest.fn(),
  },
}));

describe("TodoService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const userId = 1;
    const todoData = { subject: "Test Todo", listId: 10 };

    it("should create a todo if list exists and under limit", async () => {
      (prisma.list.findFirst as jest.Mock).mockResolvedValue({ id: 10, userId });
      (prisma.todo.count as jest.Mock).mockResolvedValue(50);
      (prisma.todo.create as jest.Mock).mockResolvedValue({ id: 100, ...todoData });

      const result = await TodoService.create(userId, todoData);

      expect(prisma.list.findFirst).toHaveBeenCalledWith({ where: { id: 10, userId } });
      expect(prisma.todo.count).toHaveBeenCalledWith({ where: { listId: 10 } });
      expect(prisma.todo.create).toHaveBeenCalled();
      expect(result.id).toBe(100);
    });

    it("should throw error if list not found for user", async () => {
      (prisma.list.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(TodoService.create(userId, todoData))
        .rejects.toThrow(DataValidationError);
    });

    it("should throw error if list is full (100 todos)", async () => {
      (prisma.list.findFirst as jest.Mock).mockResolvedValue({ id: 10, userId });
      (prisma.todo.count as jest.Mock).mockResolvedValue(100);

      await expect(TodoService.create(userId, todoData))
        .rejects.toThrow(DatabaseLimitError);
    });
  });
});
