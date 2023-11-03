import { DataValidationError } from "@/errors/DataValidationError";
import prisma from "@/prisma";
import { getAuthenticatedUserId } from "@/utils/auth";
import { zParse } from "@/utils/validation";
import dayjs from "dayjs";
import { Request, Response } from "express";
import { z } from "zod";

const dataSchema = z.object({
  body: z.object({
    done: z.boolean().default(false),
    subject: z.string().min(1).max(255),
    enableDeadline: z.boolean().nullable().default(false),
    description: z.string().max(255).nullable().default(""),
    isAllDay: z.boolean().nullable().default(false),
    location: z.string().max(255).nullable().default(""),
    recurrenceRule: z.string().max(255).nullable().default(""),
    recurrenceException: z.string().max(255).nullable().default(""),
    startTimezone: z.string().max(255).nullable().default(""),
    endTimezone: z.string().max(255).nullable().default(""),
    startTime: z.string().pipe(z.coerce.date()).default(new Date().toISOString()),
    endTime: z.string().pipe(z.coerce.date()).optional().nullable(),
    listId: z.number().nullable().default(null),
  }),
});

export async function store(req: Request, res: Response) {
  const { body } = await zParse(dataSchema, req);
  const userId = getAuthenticatedUserId(req);

  body.endTime ??= dayjs(body.startTime).add(1, "hour").toDate();

  // Voorkom dat een todo in iemand anders lijst wordt toegevoegd
  if (body.listId) {
    const list = await prisma.list.findFirst({
      where: {
        id: body.listId,
        userId,
      },
    });
    if (!list) throw new DataValidationError("Lijst niet gevonden.");
  }

  const todo = await prisma.todo.create({
    data: {
      ...body,
      userId,
    },
  });

  res.json(todo);
}

export async function destroy(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  const { params } = await zParse(
    z.object({
      params: z.object({
        todoId: z.string().regex(/^\d+$/).transform(Number),
      }),
    }),
    req,
  );

  await prisma.todo.delete({
    where: {
      id: params.todoId,
      userId,
    },
  });

  res.json(true);
}

export async function update(req: Request, res: Response) {
  const { body } = await zParse(dataSchema, req);

  const { params } = await zParse(
    z.object({
      params: z.object({
        todoId: z.string().regex(/^\d+$/).transform(Number),
      }),
    }),
    req,
  );
  const userId = getAuthenticatedUserId(req);

  // Voorkom dat een todo in iemand anders lijst wordt toegevoegd
  if (body.listId) {
    const list = await prisma.list.findFirst({
      where: {
        id: body.listId,
        userId,
      },
    });
    if (!list) throw new DataValidationError("Lijst niet gevonden.");
  }

  const todo = await prisma.todo.update({
    data: body,
    where: {
      id: params.todoId,
      userId: userId,
    },
  });

  res.json(todo);
}

export async function index(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);

  res.json(
    await prisma.todo.findMany({
      where: {
        userId: userId,
      },
      orderBy: [
        {
          done: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    }),
  );
}
