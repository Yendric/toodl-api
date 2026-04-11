import { DataValidationError } from "#/errors/DataValidationError.js";
import prisma from "#/prisma.js";
import { StoreService } from "#/services/StoreService.js";
import { vi, type Mock } from "vitest";

vi.mock("#/prisma.js", () => ({
  default: {
    $transaction: vi.fn(),
    store: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    storeCategoryOrder: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

describe("StoreService", () => {
  let storeService: StoreService;

  beforeEach(() => {
    vi.clearAllMocks();
    storeService = new StoreService();
  });

  describe("listForUser", () => {
    it("should return stores for a user", async () => {
      const mockStores = [{ id: 1, name: "Aldi", userId: 1 }];
      (prisma.store.findMany as Mock).mockResolvedValue(mockStores);

      const result = await storeService.listForUser(1);

      expect(prisma.store.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { name: "asc" },
      });
      expect(result).toEqual(mockStores);
    });
  });

  describe("updateCategoryOrder", () => {
    it("should update category order for a store within a transaction if ownership is verified", async () => {
      const mockStore = { id: 1, userId: 1, name: "Aldi" };
      (prisma.store.findFirst as Mock).mockResolvedValue(mockStore);
      (prisma.category.findMany as Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);

      (prisma.$transaction as Mock).mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
        const tx = {
          storeCategoryOrder: {
            deleteMany: vi.fn().mockResolvedValue({}),
            createMany: vi.fn().mockResolvedValue({}),
          },
        };
        return await callback(tx);
      });

      const order = [
        { categoryId: 1, position: 0 },
        { categoryId: 2, position: 1 },
      ];
      await storeService.updateCategoryOrder(1, 1, order);

      expect(prisma.store.findFirst).toHaveBeenCalledWith({ where: { id: 1, userId: 1 } });
      expect(prisma.category.findMany).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw DataValidationError if store not found", async () => {
      (prisma.store.findFirst as Mock).mockResolvedValue(null);

      await expect(storeService.updateCategoryOrder(1, 1, [])).rejects.toThrow(DataValidationError);
    });

    it("should throw DataValidationError if categories don't belong to user", async () => {
      (prisma.store.findFirst as Mock).mockResolvedValue({ id: 1, userId: 1 });
      (prisma.category.findMany as Mock).mockResolvedValue([{ id: 1 }]); // Only 1 found, but 2 requested

      const order = [
        { categoryId: 1, position: 0 },
        { categoryId: 2, position: 1 },
      ];
      await expect(storeService.updateCategoryOrder(1, 1, order)).rejects.toThrow(DataValidationError);
    });
  });
});
