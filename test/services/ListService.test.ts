import { DatabaseLimitError } from "#/errors/DatabaseLimitError.js";
import prisma from "#/prisma.js";
import { ListService } from "#/services/ListService.js";
import { vi } from "vitest";

describe("ListService", () => {
  let listService: ListService;

  beforeEach(() => {
    vi.clearAllMocks();
    listService = new ListService();
  });

  describe("listForUser", () => {
    it("should return lists for user ordered by name", async () => {
      await prisma.list.create({ data: { id: 1, name: "B List", userId: 1 } });
      await prisma.list.create({ data: { id: 2, name: "A List", userId: 1 } });

      const lists = await listService.listForUser(1);
      expect(lists).toHaveLength(2);
      expect(lists[0]?.name).toBe("A List");
      expect(lists[1]?.name).toBe("B List");
    });
  });

  describe("create", () => {
    it("should create a list if under limit", async () => {
      for (let i = 1; i <= 5; i++) {
        await prisma.list.create({ data: { id: i, name: `List ${i}`, userId: 1 } });
      }

      const result = await listService.create(1, { name: "Test List", color: "#ffffff" });

      const dbList = await prisma.list.findUnique({ where: { id: result.id } });
      expect(dbList).not.toBeNull();
      expect(dbList?.name).toBe("Test List");
      expect(result.name).toBe("Test List");

      const count = await prisma.list.count({ where: { userId: 1 } });
      expect(count).toBe(6);
    });

    it("should throw error if at max limit", async () => {
      for (let i = 1; i <= 10; i++) {
        await prisma.list.create({ data: { id: i, name: `List ${i}`, userId: 1 } });
      }

      await expect(listService.create(1, { name: "Too many", color: "#000" })).rejects.toThrow(DatabaseLimitError);
    });
  });

  describe("update", () => {
    it("should update list", async () => {
      await prisma.list.create({ data: { id: 1, name: "Old Name", userId: 1 } });

      const result = await listService.update(1, 1, { name: "New Name", color: "#ff0000" });

      expect(result.name).toBe("New Name");
      expect(result.color).toBe("#ff0000");

      const dbList = await prisma.list.findUnique({ where: { id: 1 } });
      expect(dbList?.name).toBe("New Name");
      expect(dbList?.color).toBe("#ff0000");
    });
  });

  describe("delete", () => {
    it("should delete a list if more than one exists", async () => {
      await prisma.list.create({ data: { id: 1, name: "List 1", userId: 1 } });
      await prisma.list.create({ data: { id: 2, name: "List 2", userId: 1 } });

      await listService.delete(1, 1);

      const dbList = await prisma.list.findUnique({ where: { id: 1 } });
      expect(dbList).toBeNull();

      const count = await prisma.list.count({ where: { userId: 1 } });
      expect(count).toBe(1);
    });

    it("should throw error if only one list remains", async () => {
      await prisma.list.create({ data: { id: 1, name: "List 1", userId: 1 } });

      await expect(listService.delete(1, 1)).rejects.toThrow(DatabaseLimitError);
    });
  });
});
