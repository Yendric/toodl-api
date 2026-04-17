import prisma from "#/prisma.js";
import { CategoryService } from "#/services/CategoryService.js";
import { vi } from "vitest";

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
      const mockCategory = await prisma.category.create({ data: { id: 1, name: "Groceries", userId: 1 } });

      const result = await categoryService.listForUser(1);

      expect(result).toEqual([mockCategory]);
    });
  });

  describe("create", () => {
    it("should create a category", async () => {
      const result = await categoryService.create(1, { name: "Groceries" });

      const dbCategory = await prisma.category.findUnique({ where: { id: result.id } });
      expect(dbCategory).toMatchObject({ name: "Groceries", userId: 1 });
      expect(result).toMatchObject({ name: "Groceries", userId: 1 });
    });
  });

  describe("update", () => {
    it("should update a category", async () => {
      await prisma.category.create({ data: { id: 1, name: "Groceries", userId: 1 } });

      const result = await categoryService.update(1, 1, { name: "Drinks" });

      const dbCategory = await prisma.category.findUnique({ where: { id: 1 } });
      expect(dbCategory?.name).toBe("Drinks");
      expect(result.name).toBe("Drinks");
    });
  });

  describe("delete", () => {
    it("should delete a category", async () => {
      await prisma.category.create({ data: { id: 1, name: "Groceries", userId: 1 } });

      const result = await categoryService.delete(1, 1);

      const dbCategory = await prisma.category.findUnique({ where: { id: 1 } });
      expect(dbCategory).toBeNull();
      expect(result.id).toBe(1);
    });
  });

  describe("predictCategory", () => {
    it("should return null if user has no categories", async () => {
      const result = await categoryService.predictCategory(1, "Apple");

      expect(result).toEqual({ categoryName: null });
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should throw if GEMINI_API_KEY is not configured", async () => {
      delete process.env.GEMINI_API_KEY;
      await prisma.category.create({ data: { id: 1, name: "Fruit", userId: 1 } });

      await expect(categoryService.predictCategory(1, "Apple")).rejects.toThrow("GEMINI_API_KEY is not configured.");
    });

    it("should return null if model predicts NONE", async () => {
      await prisma.category.create({ data: { id: 1, name: "Fruit", userId: 1 } });
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ category: "NONE" }) });

      const result = await categoryService.predictCategory(1, "Car");

      expect(result).toEqual({ categoryName: null });
    });

    it("should return category if model predicts existing category", async () => {
      await prisma.category.create({ data: { id: 1, name: "Fruit", userId: 1 } });
      await prisma.category.create({ data: { id: 2, name: "Groenten", userId: 1 } });
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ category: "Groenten" }) });

      const result = await categoryService.predictCategory(1, "Spinazie");

      expect(result).toEqual({ categoryName: "Groenten" });
    });

    it("should return null if model predicts a category that does not exist", async () => {
      await prisma.category.create({ data: { id: 1, name: "Fruit", userId: 1 } });
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ category: "NONE" }) });

      const result = await categoryService.predictCategory(1, "Car");

      expect(result).toEqual({ categoryName: null });
    });
  });
});
