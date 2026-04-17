import { DataValidationError } from "#/errors/DataValidationError.js";
import { DatabaseLimitError } from "#/errors/DatabaseLimitError.js";
import prisma from "#/prisma.js";
import { TodoService } from "#/services/TodoService.js";
import { vi } from "vitest";

describe("TodoService", () => {
  let todoService: TodoService;

  beforeEach(() => {
    vi.clearAllMocks();
    todoService = new TodoService();
  });

  describe("listForUser", () => {
    const userId = 1;
    it("should return sorted todos without storeId", async () => {
      await prisma.todo.create({
        data: { id: 1, subject: "Todo 1", done: false, position: "a0", userId, categoryId: null },
      });

      const result = await todoService.listForUser(userId);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(1);
    });

    it("should return sorted todos with storeId", async () => {
      await prisma.category.create({ data: { id: 1, name: "Cat 1", userId } });
      await prisma.category.create({ data: { id: 2, name: "Cat 2", userId } });
      await prisma.todo.create({
        data: { id: 1, subject: "Todo 1", done: false, position: "a0", userId, categoryId: 1 },
      });
      await prisma.todo.create({
        data: { id: 2, subject: "Todo 2", done: false, position: "a1", userId, categoryId: 2 },
      });

      await prisma.store.create({ data: { id: 100, userId, name: "Store 1" } });
      await prisma.storeCategoryOrder.create({ data: { storeId: 100, categoryId: 2, position: 0 } });
      await prisma.storeCategoryOrder.create({ data: { storeId: 100, categoryId: 1, position: 1 } });

      const result = await todoService.listForUser(userId, 100);

      expect(result?.[0]?.id).toBe(2);
      expect(result?.[1]?.id).toBe(1);
    });

    it("should throw error if store not found", async () => {
      await expect(todoService.listForUser(userId, 100)).rejects.toThrow(DataValidationError);
    });

    it("should fallback to position if store orders are equal", async () => {
      await prisma.category.create({ data: { id: 1, name: "Cat 1", userId } });
      await prisma.todo.create({
        data: { id: 1, subject: "Todo 1", done: false, position: "a1", userId, categoryId: 1 },
      });
      await prisma.todo.create({
        data: { id: 2, subject: "Todo 2", done: false, position: "a0", userId, categoryId: 1 },
      });

      await prisma.store.create({ data: { id: 100, userId, name: "Store 1" } });
      await prisma.storeCategoryOrder.create({ data: { storeId: 100, categoryId: 1, position: 0 } });

      const result = await todoService.listForUser(userId, 100);

      expect(result?.[0]?.id).toBe(2);
      expect(result?.[1]?.id).toBe(1);
    });
  });

  describe("listByList", () => {
    const userId = 1;
    const listId = 10;
    
    it("should return sorted todos for a specific list without storeId", async () => {
      await prisma.list.create({ data: { id: listId, name: "List 1", userId } });
      await prisma.todo.create({ data: { id: 1, subject: "Todo 1", done: false, position: "a0", userId, listId, categoryId: null } });
      
      const result = await todoService.listByList(userId, listId);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(1);
    });

    it("should return sorted todos for a specific list with storeId", async () => {
      await prisma.category.create({ data: { id: 1, name: "Cat 1", userId } });
      await prisma.list.create({ data: { id: listId, name: "List 1", userId } });
      await prisma.todo.create({ data: { id: 1, subject: "Todo 1", done: false, position: "a0", userId, listId, categoryId: 1 } });
      await prisma.store.create({ data: { id: 100, userId, name: "Store 1" } });
      await prisma.storeCategoryOrder.create({ data: { storeId: 100, categoryId: 1, position: 0 } });
      
      const result = await todoService.listByList(userId, listId, 100);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(1);
    });

    it("should throw error if store not found", async () => {
      await expect(todoService.listByList(userId, listId, 100)).rejects.toThrow(DataValidationError);
    });
  });

  describe("create", () => {
    const userId = 1;
    const todoData = { subject: "Test Todo", listId: 10, categoryId: 5 };

    it("should create a todo if list and category exist", async () => {
      await prisma.list.create({ data: { id: 10, name: "List 1", userId } });
      await prisma.category.create({ data: { id: 5, name: "Cat 1", userId } });

      const result = await todoService.create(userId, todoData);

      expect(result.subject).toBe("Test Todo");
      expect(result.listId).toBe(10);
      expect(result.categoryId).toBe(5);
      expect(result.position).toBeDefined();

      const dbTodo = await prisma.todo.findUnique({ where: { id: result.id } });
      expect(dbTodo).not.toBeNull();
    });

    it("should throw error if category not found for user", async () => {
      await prisma.list.create({ data: { id: 10, name: "List 1", userId } });

      await expect(todoService.create(userId, todoData)).rejects.toThrow(DataValidationError);
    });

    it("should throw error if list not found", async () => {
      await expect(todoService.create(userId, { subject: "Test", listId: 999 })).rejects.toThrow(DataValidationError);
    });

    it("should throw error if list has 100 or more todos", async () => {
      await prisma.list.create({ data: { id: 10, name: "List 1", userId } });
      
      for (let i = 1; i <= 100; i++) {
        await prisma.todo.create({ data: { id: i, subject: `Todo ${i}`, done: false, position: `a${i}`, userId, listId: 10 } });
      }

      await expect(todoService.create(userId, { subject: "Max", listId: 10 })).rejects.toThrow(DatabaseLimitError);
    });

    it("should generate a position if none is provided based on last todo", async () => {
      await prisma.todo.create({ data: { id: 1, subject: "Todo 1", done: false, position: "a0", userId, listId: null } });

      const result = await todoService.create(userId, { subject: "Test Todo 2" });
      
      expect(result.position).toBeDefined();
      expect(result.position > "a0").toBe(true);
    });
  });

  describe("update", () => {
    const userId = 1;
    const todoId = 100;

    it("should allow setting listId to null", async () => {
      await prisma.list.create({ data: { id: 10, name: "List 1", userId } });
      await prisma.todo.create({ data: { id: todoId, subject: "Test", userId, position: "a0", listId: 10 } });

      await todoService.update(userId, todoId, { listId: null });

      const dbTodo = await prisma.todo.findUnique({ where: { id: todoId } });
      expect(dbTodo?.listId).toBeNull();
    });

    it("should verify list ownership when updating listId", async () => {
      await prisma.todo.create({ data: { id: todoId, subject: "Test", userId, position: "a0", listId: null } });

      await expect(todoService.update(userId, todoId, { listId: 20 })).rejects.toThrow(DataValidationError);
    });

    it("should connect new list when listId is valid", async () => {
      await prisma.list.create({ data: { id: 10, name: "List 1", userId } });
      await prisma.todo.create({ data: { id: todoId, subject: "Test", userId, position: "a0", listId: null } });

      await todoService.update(userId, todoId, { listId: 10 });

      const dbTodo = await prisma.todo.findUnique({ where: { id: todoId } });
      expect(dbTodo?.listId).toBe(10);
    });

    it("should allow setting categoryId to null", async () => {
      await prisma.category.create({ data: { id: 5, name: "Cat 1", userId } });
      await prisma.todo.create({ data: { id: todoId, subject: "Test", userId, position: "a0", categoryId: 5 } });

      await todoService.update(userId, todoId, { categoryId: null });

      const dbTodo = await prisma.todo.findUnique({ where: { id: todoId } });
      expect(dbTodo?.categoryId).toBeNull();
    });

    it("should verify category ownership when updating categoryId", async () => {
      await prisma.todo.create({ data: { id: todoId, subject: "Test", userId, position: "a0", categoryId: null } });

      await expect(todoService.update(userId, todoId, { categoryId: 20 })).rejects.toThrow(DataValidationError);
    });

    it("should connect new category when categoryId is valid", async () => {
      await prisma.category.create({ data: { id: 5, name: "Cat 1", userId } });
      await prisma.todo.create({ data: { id: todoId, subject: "Test", userId, position: "a0", categoryId: null } });

      await todoService.update(userId, todoId, { categoryId: 5 });

      const dbTodo = await prisma.todo.findUnique({ where: { id: todoId } });
      expect(dbTodo?.categoryId).toBe(5);
    });

    it("should update startTime and endTime", async () => {
      await prisma.todo.create({ data: { id: todoId, subject: "Test", userId, position: "a0" } });
      const newStart = new Date("2025-01-01T10:00:00Z");
      const newEnd = new Date("2025-01-01T11:00:00Z");

      await todoService.update(userId, todoId, { startTime: newStart, endTime: newEnd });

      const dbTodo = await prisma.todo.findUnique({ where: { id: todoId } });
      expect(dbTodo?.startTime).toEqual(newStart);
      expect(dbTodo?.endTime).toEqual(newEnd);
    });
  });

  describe("delete", () => {
    const userId = 1;
    const todoId = 100;

    it("should delete a todo", async () => {
      await prisma.todo.create({ data: { id: todoId, subject: "Test", userId, position: "a0" } });

      await todoService.delete(userId, todoId);

      const dbTodo = await prisma.todo.findUnique({ where: { id: todoId } });
      expect(dbTodo).toBeNull();
    });
  });
});