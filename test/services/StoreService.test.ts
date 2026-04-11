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
    it("should update category order for a store within a transaction", async () => {
      const mockStore = { id: 1, userId: 1, name: "Aldi" };
      (prisma.store.findFirst as Mock).mockResolvedValue(mockStore);

      (prisma.$transaction as Mock).mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
        const tx = {
          storeCategoryOrder: {
            deleteMany: vi.fn().mockResolvedValue({}),
            createMany: vi.fn().mockResolvedValue({}),
          },
        };
        return await callback(tx);
      });

      const order = [{ categoryId: 1, position: 0 }, { categoryId: 2, position: 1 }];
      await storeService.updateCategoryOrder(1, 1, order);

      expect(prisma.store.findFirst).toHaveBeenCalledWith({ where: { id: 1, userId: 1 } });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw error if store not found", async () => {
      (prisma.store.findFirst as Mock).mockResolvedValue(null);

      await expect(storeService.updateCategoryOrder(1, 1, [])).rejects.toThrow("Store not found");
    });
  });
});
