import { type ICategoryService } from "#/services/CategoryService.js";
import { getAuthenticatedUserId } from "#/utils/auth.js";
import { type Request as ExRequest } from "express";
import { Body, Controller, Delete, Get, Path, Post, Request, Route, Security, Tags } from "tsoa";

interface CategoryRequest {
  /**
   * @minLength 1
   * @maxLength 50
   */
  name: string;
}

interface CategoryResponse {
  id: number;
  name: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

@Route("categories")
@Tags("Category")
@Security("session")
export class CategoryController extends Controller {
  constructor(private categoryService: ICategoryService) {
    super();
  }

  @Get("/")
  public async index(@Request() request: ExRequest): Promise<CategoryResponse[]> {
    const userId = getAuthenticatedUserId(request);
    return await this.categoryService.listForUser(userId);
  }

  @Post("/")
  public async store(@Request() request: ExRequest, @Body() body: CategoryRequest): Promise<CategoryResponse> {
    const userId = getAuthenticatedUserId(request);
    return await this.categoryService.create(userId, body);
  }

  @Post("{categoryId}")
  public async update(
    @Request() request: ExRequest,
    @Path() categoryId: number,
    @Body() body: CategoryRequest,
  ): Promise<CategoryResponse> {
    const userId = getAuthenticatedUserId(request);
    return await this.categoryService.update(userId, categoryId, body);
  }

  @Delete("{categoryId}")
  public async destroy(@Request() request: ExRequest, @Path() categoryId: number): Promise<boolean> {
    const userId = getAuthenticatedUserId(request);
    await this.categoryService.delete(userId, categoryId);
    return true;
  }
}
