import prisma from "#/prisma.js";
import { type Store, type StoreCategoryOrder } from "@prisma/client";

export interface IStoreService {
  listForUser(userId: number): Promise<Store[]>;
  create(userId: number, data: { name: string }): Promise<Store>;
  update(userId: number, storeId: number, data: { name: string }): Promise<Store>;
  delete(userId: number, storeId: number): Promise<Store>;
  getCategoryOrder(userId: number, storeId: number): Promise<StoreCategoryOrder[]>;
  updateCategoryOrder(
    userId: number,
    storeId: number,
    order: { categoryId: number; position: number }[],
  ): Promise<void>;
}

export class StoreService implements IStoreService {
  public async listForUser(userId: number): Promise<Store[]> {
    return await prisma.store.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  }

  public async create(userId: number, data: { name: string }): Promise<Store> {
    return await prisma.store.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  public async update(userId: number, storeId: number, data: { name: string }): Promise<Store> {
    return await prisma.store.update({
      where: { id: storeId, userId },
      data,
    });
  }

  public async delete(userId: number, storeId: number): Promise<Store> {
    return await prisma.store.delete({
      where: { id: storeId, userId },
    });
  }

  public async getCategoryOrder(userId: number, storeId: number): Promise<StoreCategoryOrder[]> {
    // Check if store belongs to user
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!store) throw new Error("Store not found");

    return await prisma.storeCategoryOrder.findMany({
      where: { storeId },
      orderBy: { position: "asc" },
    });
  }

  public async updateCategoryOrder(
    userId: number,
    storeId: number,
    order: { categoryId: number; position: number }[],
  ): Promise<void> {
    // Check if store belongs to user
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!store) throw new Error("Store not found");

    await prisma.$transaction(async (tx) => {
      // Clear existing order
      await tx.storeCategoryOrder.deleteMany({
        where: { storeId },
      });

      // Create new order
      await tx.storeCategoryOrder.createMany({
        data: order.map((o) => ({
          storeId,
          categoryId: o.categoryId,
          position: o.position,
        })),
      });
    });
  }
}
