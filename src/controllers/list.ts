import prisma from "@/prisma";
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

interface ListRequest {
  /**
   * @minLength 1
   * @maxLength 20
   */
  name: string;
  /**
   * @pattern ^#[0-9A-Fa-f]{6}$
   */
  color: string;
}

@Route("lists")
@Tags("List")
@Security("session")
export class ListController extends Controller {
  @Get("/")
  public async index(@Request() request: ExRequest): Promise<any[]> {
    const userId = getAuthenticatedUserId(request);

    return await prisma.list.findMany({
      where: {
        userId,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  @Post("/")
  public async store(
    @Request() request: ExRequest,
    @Body() body: ListRequest,
  ): Promise<any> {
    const userId = getAuthenticatedUserId(request);

    return await prisma.list.create({
      data: {
        ...body,
        userId,
      },
    });
  }

  @Post("{listId}")
  public async update(
    @Request() request: ExRequest,
    @Path() listId: number,
    @Body() body: ListRequest,
  ): Promise<any> {
    const userId = getAuthenticatedUserId(request);

    return await prisma.list.update({
      data: body,
      where: { id: listId, userId },
    });
  }

  @Delete("{listId}")
  public async destroy(
    @Request() request: ExRequest,
    @Path() listId: number,
  ): Promise<boolean> {
    const userId = getAuthenticatedUserId(request);

    await prisma.list.delete({ where: { id: listId, userId } });

    return true;
  }
}
