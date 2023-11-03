import prisma from "@/prisma";
import { getAuthenticatedUserId } from "@/utils/auth";
import { zParse } from "@/utils/validation";
import { Request, Response } from "express";
import { z } from "zod";

const dataSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(20),
    color: z.string().length(7),
  }),
});

export async function update(req: Request, res: Response) {
  const { body } = await zParse(dataSchema, req);
  const { params } = await zParse(
    z.object({
      params: z.object({
        listId: z.string().regex(/^\d+$/).transform(Number),
      }),
    }),
    req,
  );
  const userId = getAuthenticatedUserId(req);

  const list = await prisma.list.update({
    data: body,
    where: { id: params.listId, userId },
  });

  res.json(list);
}

export async function destroy(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  const { params } = await zParse(
    z.object({
      params: z.object({
        listId: z.string().regex(/^\d+$/).transform(Number),
      }),
    }),
    req,
  );

  await prisma.list.delete({ where: { id: params.listId, userId } });

  res.json(true);
}

export async function store(req: Request, res: Response) {
  const { body } = await zParse(dataSchema, req);
  const userId = getAuthenticatedUserId(req);

  const list = await prisma.list.create({
    data: {
      ...body,
      userId,
    },
  });

  res.json(list);
}

export async function index(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);

  res.json(
    await prisma.list.findMany({
      where: {
        userId,
      },
      orderBy: {
        name: "asc",
      },
    }),
  );
}
