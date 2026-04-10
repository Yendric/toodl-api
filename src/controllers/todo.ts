import { DataValidationError } from "@/errors/DataValidationError";
import prisma from "@/prisma";
import { getAuthenticatedUserId } from "@/utils/auth";
import dayjs from "dayjs";
import { Request as ExRequest } from "express";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";

interface TodoCreateRequest {
  done?: boolean;
  subject: string;
  enableDeadline?: boolean | null;
  description?: string | null;
  isAllDay?: boolean | null;
  location?: string | null;
  recurrenceRule?: string | null;
  recurrenceException?: string | null;
  startTimezone?: string | null;
  endTimezone?: string | null;
  startTime?: string | Date;
  endTime?: string | Date | null;
  listId?: number | null;
}

@Route("todos")
@Tags("Todo")
@Security("session")
export class TodoController extends Controller {
  @Get("/")
  public async index(@Request() request: ExRequest): Promise<any[]> {
    const userId = getAuthenticatedUserId(request);

    return await prisma.todo.findMany({
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
    });
  }

  @Post("/")
  public async store(
    @Request() request: ExRequest,
    @Body() body: TodoCreateRequest,
  ): Promise<any> {
    const userId = getAuthenticatedUserId(request);

    let { startTime, endTime, listId, ...rest } = body;
    startTime = startTime ? new Date(startTime) : new Date();
    endTime = endTime ? new Date(endTime) : dayjs(startTime).add(1, "hour").toDate();

    // Voorkom dat een todo in iemand anders lijst wordt toegevoegd
    if (listId) {
      const list = await prisma.list.findFirst({
        where: {
          id: listId,
          userId,
        },
      });
      if (!list) throw new DataValidationError("Lijst niet gevonden.");
    }

    return await prisma.todo.create({
      data: {
        ...rest,
        startTime,
        endTime,
        listId,
        userId,
      },
    });
  }

  @Post("{todoId}")
  public async update(
    @Request() request: ExRequest,
    @Path() todoId: number,
    @Body() body: TodoCreateRequest,
  ): Promise<any> {
    const userId = getAuthenticatedUserId(request);

    let { startTime, endTime, listId, ...rest } = body;
    if (startTime) startTime = new Date(startTime);
    if (endTime) endTime = new Date(endTime);

    // Voorkom dat een todo in iemand anders lijst wordt toegevoegd
    if (listId) {
      const list = await prisma.list.findFirst({
        where: {
          id: listId,
          userId,
        },
      });
      if (!list) throw new DataValidationError("Lijst niet gevonden.");
    }

    return await prisma.todo.update({
      data: {
        ...rest,
        startTime,
        endTime,
        listId,
      },
      where: {
        id: todoId,
        userId: userId,
      },
    });
  }

  @Delete("{todoId}")
  public async destroy(
    @Request() request: ExRequest,
    @Path() todoId: number,
  ): Promise<boolean> {
    const userId = getAuthenticatedUserId(request);

    await prisma.todo.delete({
      where: {
        id: todoId,
        userId,
      },
    });

    return true;
  }
}
