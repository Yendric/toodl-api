import { body, matchedData } from "express-validator";
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import List from "@/models/List";
import validate from "@/middleware/validation";
import { broadcastLists, broadcastTodos } from "@/socket/broadcastingService";

export const update = [
  body("name").isString().isLength({ min: 1, max: 20 }),
  body("color").isString().isLength({ min: 7, max: 7 }),
  body("withoutDates").isBoolean(),
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const list = await List.update(matchedData(req), {
      where: { id: req.params.listId, userId: req.session.user?.id },
    });
    broadcastLists(req.session.user);
    res.json(list);
  }),
];

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  await List.destroy({ where: { id: req.params.listId, userId: req.session.user?.id } });

  broadcastLists(req.session.user);
  broadcastTodos(req.session.user);
  res.json(true);
});

export const store = [
  body("name").isString().isLength({ min: 1, max: 20 }),
  body("color").isString().isLength({ min: 7, max: 7 }),
  body("withoutDates").isBoolean(),
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const list = await List.create({ ...matchedData(req), userId: req.session.user?.id });
    broadcastLists(req.session.user);
    res.json(list);
  }),
];

export const index = async (req: Request, res: Response) => {
  res.json(
    await req.session.user?.$get("lists", {
      order: [["name", "ASC"]],
    })
  );
};
