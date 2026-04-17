import { DataValidationError } from "#/errors/DataValidationError.js";
import prisma from "#/prisma.js";
import { StoreService } from "#/services/StoreService.js";
import { vi } from "vitest";

describe("StoreService", () => {
  let storeService: StoreService;

  beforeEach(() => {
    vi.clearAllMocks();
    storeService = new StoreService();
  });

  describe("listForUser", () => {
    it("should return stores for a user", async () => {
      const mockStore = await prisma.store.create({ data: { id: 1, name: "Aldi", userId: 1 } });

      const result = await storeService.listForUser(1);

      expect(result).toEqual([mockStore]);
    });
  });

  describe("create", () => {
    it("should create a store", async () => {
      const result = await storeService.create(1, { name: "Colruyt" });
      
      expect(result.name).toBe("Colruyt");
      expect(result.userId).toBe(1);

      const dbStore = await prisma.store.findUnique({ where: { id: result.id } });
      expect(dbStore).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update a store", async () => {
      const store = await prisma.store.create({ data: { id: 1, name: "Aldi", userId: 1 } });
      
      const result = await storeService.update(1, 1, { name: "Delhaize" });
      
      expect(result.name).toBe("Delhaize");

      const dbStore = await prisma.store.findUnique({ where: { id: 1 } });
      expect(dbStore?.name).toBe("Delhaize");
    });
  });

  describe("delete", () => {
    it("should delete a store", async () => {
      await prisma.store.create({ data: { id: 1, name: "Aldi", userId: 1 } });
      
      await storeService.delete(1, 1);
      
      const dbStore = await prisma.store.findUnique({ where: { id: 1 } });
      expect(dbStore).toBeNull();
    });
  });

  describe("getCategoryOrder", () => {
    it("should return category order for a store", async () => {
      await prisma.store.create({ data: { id: 1, name: "Aldi", userId: 1 } });
      await prisma.storeCategoryOrder.create({ data: { storeId: 1, categoryId: 10, position: 0 } });

      const result = await storeService.getCategoryOrder(1, 1);
      
      expect(result).toHaveLength(1);
      expect(result[0]?.categoryId).toBe(10);
    });

    it("should throw error if store not found", async () => {
      await expect(storeService.getCategoryOrder(1, 999)).rejects.toThrow(DataValidationError);
    });
  });

  describe("updateCategoryOrder", () => {
    it("should update category order for a store within a transaction if ownership is verified", async () => {
      await prisma.store.create({ data: { id: 1, userId: 1, name: "Aldi" } });
      await prisma.category.create({ data: { id: 1, name: "Cat 1", userId: 1 } });
      await prisma.category.create({ data: { id: 2, name: "Cat 2", userId: 1 } });

      const order = [
        { categoryId: 1, position: 0 },
        { categoryId: 2, position: 1 },
      ];
      await storeService.updateCategoryOrder(1, 1, order);

      const orders = await prisma.storeCategoryOrder.findMany({ where: { storeId: 1 } });
      expect(orders).toHaveLength(2);
      expect(orders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ storeId: 1, categoryId: 1, position: 0 }),
          expect.objectContaining({ storeId: 1, categoryId: 2, position: 1 }),
        ]),
      );
    });

    it("should throw DataValidationError if store not found", async () => {
      await expect(storeService.updateCategoryOrder(1, 1, [])).rejects.toThrow(DataValidationError);
    });

    it("should throw DataValidationError if categories don't belong to user", async () => {
      await prisma.store.create({ data: { id: 1, userId: 1, name: "Aldi" } });
      await prisma.category.create({ data: { id: 1, name: "Cat 1", userId: 1 } });

      const order = [
        { categoryId: 1, position: 0 },
        { categoryId: 2, position: 1 },
      ];
      await expect(storeService.updateCategoryOrder(1, 1, order)).rejects.toThrow(DataValidationError);
    });
  });
});
