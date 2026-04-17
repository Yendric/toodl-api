import { injectable } from "inversify";
import { predictCategoryDailyLimiter, predictCategoryMinuteLimiter } from "#/middleware/rateLimiter.js";
import { CategoryService } from "#/services/CategoryService.js";
import { getAuthenticatedUserId } from "#/utils/auth.js";
import { type Request as ExRequest } from "express";
import { Body, Controller, Delete, Get, Middlewares, Path, Post, Request, Route, Security, Tags } from "tsoa";

interface CategoryRequest {
  /**
   * @minLength 1
   * @maxLength 300
   */
  name: string;
}

interface CategoryPredictRequest {
  /**
   * @minLength 1
   * @maxLength 300
   */
  itemName: string;
}

interface CategoryPredictResponse {
  categoryName: string | null;
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
@injectable()
export class CategoryController extends Controller {
  constructor(private categoryService: CategoryService) {
    super();
  }

  @Post("/predict")
  @Middlewares([predictCategoryMinuteLimiter, predictCategoryDailyLimiter])
  public async predict(
    @Request() request: ExRequest,
    @Body() body: CategoryPredictRequest,
  ): Promise<CategoryPredictResponse> {
    const userId = getAuthenticatedUserId(request);
    return await this.categoryService.predictCategory(userId, body.itemName);
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
