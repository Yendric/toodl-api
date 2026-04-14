import { type Category } from "#/generated/prisma/client.js";
import prisma from "#/prisma.js";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

export interface ICategoryService {
  listForUser(userId: number): Promise<Category[]>;
  create(userId: number, data: { name: string }): Promise<Category>;
  update(userId: number, categoryId: number, data: { name: string }): Promise<Category>;
  delete(userId: number, categoryId: number): Promise<Category>;
  predictCategory(userId: number, itemName: string): Promise<{ categoryName: string | null }>;
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

  public async predictCategory(userId: number, itemName: string): Promise<{ categoryName: string | null }> {
    const categories = await this.listForUser(userId);
    if (categories.length === 0) {
      return { categoryName: null };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const categoryNames = categories.map((c) => c.name);

    const systemInstruction = `You are an intelligent shopping list assistant. Your task is to categorize a given item into one of the user's existing supermarket categories.
The item name will often be in Dutch, and could be a brand name or a generic product.
If the item does not reasonably fit into ANY of the provided categories, you must select "NONE".`;

    const prompt = `User's categories: \n${categoryNames.map((name) => `- ${name}`).join("\n")}
\nItem to categorize: "${itemName}"`;

    const response = await ai.models.generateContent({
      model: "gemma-4-31b-it",
      contents: prompt,
      config: {
        systemInstruction,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              enum: [...categoryNames, "NONE"],
              description: "The most specific, applicable category name, or 'NONE'.",
            },
          },
          required: ["category"],
        },
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
      },
    });

    if (!response.text) return { categoryName: null };

    const result = JSON.parse(response.text) as { category: string };
    const predicted = result.category;

    if (predicted === "NONE") {
      return { categoryName: null };
    }

    return { categoryName: predicted };
  }
}
