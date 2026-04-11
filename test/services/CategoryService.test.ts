import prisma from "#/prisma.js";
import { CategoryService } from "#/services/CategoryService.js";
import { vi, type Mock } from "vitest";

vi.mock("#/prisma.js", () => ({
  default: {
    category: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("CategoryService", () => {
  let categoryService: CategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    categoryService = new CategoryService();
  });

  describe("listForUser", () => {
    it("should return categories for a user", async () => {
      const mockCategories = [{ id: 1, name: "Groceries", userId: 1 }];
      (prisma.category.findMany as Mock).mockResolvedValue(mockCategories);

      const result = await categoryService.listForUser(1);

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { name: "asc" },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe("create", () => {
    it("should create a category", async () => {
      const mockCategory = { id: 1, name: "Groceries", userId: 1 };
      (prisma.category.create as Mock).mockResolvedValue(mockCategory);

      const result = await categoryService.create(1, { name: "Groceries" });

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { name: "Groceries", userId: 1 },
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe("update", () => {
    it("should update a category", async () => {
      const mockCategory = { id: 1, name: "Drinks", userId: 1 };
      (prisma.category.update as Mock).mockResolvedValue(mockCategory);

      const result = await categoryService.update(1, 1, { name: "Drinks" });

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        data: { name: "Drinks" },
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe("delete", () => {
    it("should delete a category", async () => {
      const mockCategory = { id: 1, name: "Groceries", userId: 1 };
      (prisma.category.delete as Mock).mockResolvedValue(mockCategory);

      const result = await categoryService.delete(1, 1);

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
      expect(result).toEqual(mockCategory);
    });
  });
});
