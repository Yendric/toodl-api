import prisma from "#/prisma.js";
import { type Category } from "@prisma/client";

export interface ICategoryService {
  listForUser(userId: number): Promise<Category[]>;
  create(userId: number, data: { name: string }): Promise<Category>;
  update(userId: number, categoryId: number, data: { name: string }): Promise<Category>;
  delete(userId: number, categoryId: number): Promise<Category>;
}

export class CategoryService implements ICategoryService {
  public async listForUser(userId: number): Promise<Category[]> {
    return await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  }

  public async create(userId: number, data: { name: string }): Promise<Category> {
    return await prisma.category.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  public async update(userId: number, categoryId: number, data: { name: string }): Promise<Category> {
    return await prisma.category.update({
      where: { id: categoryId, userId },
      data,
    });
  }

  public async delete(userId: number, categoryId: number): Promise<Category> {
    return await prisma.category.delete({
      where: { id: categoryId, userId },
    });
  }
}
