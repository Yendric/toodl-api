import { type IStoreService } from "#/services/StoreService.js";
import { getAuthenticatedUserId } from "#/utils/auth.js";
import { type Request as ExRequest } from "express";
import { Body, Controller, Delete, Get, Path, Post, Request, Route, Security, Tags } from "tsoa";

interface StoreRequest {
  /**
   * @minLength 1
   * @maxLength 50
   */
  name: string;
}

interface StoreResponse {
  id: number;
  name: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface StoreCategoryOrderRequest {
  categoryId: number;
  position: number;
}

interface StoreCategoryOrderResponse {
  storeId: number;
  categoryId: number;
  position: number;
}

@Route("stores")
@Tags("Store")
@Security("session")
export class StoreController extends Controller {
  constructor(private storeService: IStoreService) {
    super();
  }

  @Get("/")
  public async index(@Request() request: ExRequest): Promise<StoreResponse[]> {
    const userId = getAuthenticatedUserId(request);
    return await this.storeService.listForUser(userId);
  }

  @Post("/")
  public async store(@Request() request: ExRequest, @Body() body: StoreRequest): Promise<StoreResponse> {
    const userId = getAuthenticatedUserId(request);
    return await this.storeService.create(userId, body);
  }

  @Post("{storeId}")
  public async update(
    @Request() request: ExRequest,
    @Path() storeId: number,
    @Body() body: StoreRequest,
  ): Promise<StoreResponse> {
    const userId = getAuthenticatedUserId(request);
    return await this.storeService.update(userId, storeId, body);
  }

  @Delete("{storeId}")
  public async destroy(@Request() request: ExRequest, @Path() storeId: number): Promise<boolean> {
    const userId = getAuthenticatedUserId(request);
    await this.storeService.delete(userId, storeId);
    return true;
  }

  @Get("{storeId}/order")
  public async getOrder(
    @Request() request: ExRequest,
    @Path() storeId: number,
  ): Promise<StoreCategoryOrderResponse[]> {
    const userId = getAuthenticatedUserId(request);
    return await this.storeService.getCategoryOrder(userId, storeId);
  }

  @Post("{storeId}/order")
  public async updateOrder(
    @Request() request: ExRequest,
    @Path() storeId: number,
    @Body() body: StoreCategoryOrderRequest[],
  ): Promise<boolean> {
    const userId = getAuthenticatedUserId(request);
    await this.storeService.updateCategoryOrder(userId, storeId, body);
    return true;
  }
}
