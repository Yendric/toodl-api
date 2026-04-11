import { type ITodoService } from "#/services/TodoService.js";
import { getAuthenticatedUserId } from "#/utils/auth.js";
import { type Request as ExRequest } from "express";
import { Body, Controller, Delete, Get, Path, Post, Query, Request, Route, Security, Tags } from "tsoa";

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
  /**
   * @maxLength 255
   */
  position?: string;
  categoryId?: number | null;
}

interface TodoResponse {
  id: number;
  subject: string;
  description: string | null;
  enableDeadline: boolean | null;
  isAllDay: boolean | null;
  location: string | null;
  recurrenceRule: string | null;
  startTimezone: string | null;
  endTimezone: string | null;
  startTime: Date | null;
  endTime: Date | null;
  recurrenceException: string | null;
  position: string;
  done: boolean;
  listId: number | null;
  userId: number;
  categoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

@Route("todos")
@Tags("Todo")
@Security("session")
export class TodoController extends Controller {
  constructor(private todoService: ITodoService) {
    super();
  }

  @Get("/")
  public async index(@Request() request: ExRequest, @Query() storeId?: number): Promise<TodoResponse[]> {
    const userId = getAuthenticatedUserId(request);
    return await this.todoService.listForUser(userId, storeId);
  }

  @Post("/")
  public async store(@Request() request: ExRequest, @Body() body: TodoCreateRequest): Promise<TodoResponse> {
    const userId = getAuthenticatedUserId(request);
    return await this.todoService.create(userId, body);
  }

  @Post("{todoId}")
  public async update(
    @Request() request: ExRequest,
    @Path() todoId: number,
    @Body() body: TodoCreateRequest,
  ): Promise<TodoResponse> {
    const userId = getAuthenticatedUserId(request);
    return await this.todoService.update(userId, todoId, body);
  }

  @Delete("{todoId}")
  public async destroy(@Request() request: ExRequest, @Path() todoId: number): Promise<boolean> {
    const userId = getAuthenticatedUserId(request);
    await this.todoService.delete(userId, todoId);
    return true;
  }
}
