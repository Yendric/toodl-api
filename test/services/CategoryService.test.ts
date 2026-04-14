import prisma from "#/prisma.js";
import { CategoryService } from "#/services/CategoryService.js";
import { vi, type Mock } from "vitest";

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => ({
  ThinkingLevel: {
    MINIMAL: "MINIMAL",
  },
  Type: {
    OBJECT: "OBJECT",
    STRING: "STRING",
  },
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

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
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    categoryService = new CategoryService();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-api-key" };
  });

  afterAll(() => {
    process.env = originalEnv;
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

  describe("predictCategory", () => {
    it("should return null if user has no categories", async () => {
      (prisma.category.findMany as Mock).mockResolvedValue([]);

      const result = await categoryService.predictCategory(1, "Apple");

      expect(result).toEqual({ categoryName: null });
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should throw if GEMINI_API_KEY is not configured", async () => {
      delete process.env.GEMINI_API_KEY;
      (prisma.category.findMany as Mock).mockResolvedValue([{ id: 1, name: "Fruit", userId: 1 }]);

      await expect(categoryService.predictCategory(1, "Apple")).rejects.toThrow("GEMINI_API_KEY is not configured.");
    });

    it("should return null if model predicts NONE", async () => {
      (prisma.category.findMany as Mock).mockResolvedValue([{ id: 1, name: "Fruit", userId: 1 }]);
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ category: "NONE" }) });

      const result = await categoryService.predictCategory(1, "Car");

      expect(result).toEqual({ categoryName: null });
    });

    it("should return category if model predicts existing category", async () => {
      (prisma.category.findMany as Mock).mockResolvedValue([
        { id: 1, name: "Fruit", userId: 1 },
        { id: 2, name: "Groenten", userId: 1 },
      ]);
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ category: "Groenten" }) });

      const result = await categoryService.predictCategory(1, "Spinazie");

      expect(result).toEqual({ categoryName: "Groenten" });
    });

    it("should return null if model predicts a category that does not exist", async () => {
      (prisma.category.findMany as Mock).mockResolvedValue([{ id: 1, name: "Fruit", userId: 1 }]);
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ category: "NONE" }) });

      const result = await categoryService.predictCategory(1, "Car");

      expect(result).toEqual({ categoryName: null });
    });
  });
});
