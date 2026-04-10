import { TodoService } from "@/services/TodoService";
import { getAuthenticatedUserId } from "@/utils/auth";
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
  /**
   * @minLength 1
   * @maxLength 255
   */
  subject: string;
  enableDeadline?: boolean | null;
  /**
   * @maxLength 255
   */
  description?: string | null;
  isAllDay?: boolean | null;
  /**
   * @maxLength 255
   */
  location?: string | null;
  /**
   * @maxLength 255
   */
  recurrenceRule?: string | null;
  /**
   * @maxLength 255
   */
  recurrenceException?: string | null;
  /**
   * @maxLength 255
   */
  startTimezone?: string | null;
  /**
   * @maxLength 255
   */
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
    return await TodoService.listForUser(userId);
  }

  @Post("/")
  public async store(
    @Request() request: ExRequest,
    @Body() body: TodoCreateRequest,
  ): Promise<any> {
    const userId = getAuthenticatedUserId(request);
    return await TodoService.create(userId, body);
  }

  @Post("{todoId}")
  public async update(
    @Request() request: ExRequest,
    @Path() todoId: number,
    @Body() body: TodoCreateRequest,
  ): Promise<any> {
    const userId = getAuthenticatedUserId(request);
    return await TodoService.update(userId, todoId, body);
  }

  @Delete("{todoId}")
  public async destroy(
    @Request() request: ExRequest,
    @Path() todoId: number,
  ): Promise<boolean> {
    const userId = getAuthenticatedUserId(request);
    await TodoService.delete(userId, todoId);
    return true;
  }
}
