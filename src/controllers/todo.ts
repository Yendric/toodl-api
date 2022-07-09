import dayjs from "dayjs";
import { Request, Response } from "express";
import { body, matchedData } from "express-validator";
import asyncHandler from "express-async-handler";
import validate from "@/middleware/validation";
import Todo from "@/models/Todo";
import { broadcastTodos } from "@/socket/broadcastingService";
import { DataValidationError } from "@/errors/DataValidationError";

const validationArray = [
  body("done").isBoolean().optional({ nullable: true }),
  body("done").default(false),
  body("subject").isString().isLength({ max: 255 }),
  body("description").isString().isLength({ max: 255 }).optional({ nullable: true }),
  body("description").default(""),
  body("isAllDay").isBoolean().optional({ nullable: true }),
  body("location").isString().isLength({ max: 255 }).optional({ nullable: true }),
  body("location").default(""),
  body("recurrenceRule").isString().isLength({ max: 255 }).optional({ nullable: true }),
  body("recurrenceRule").default(""),
  body("startTimeZone").isString().isLength({ max: 255 }).optional({ nullable: true }),
  body("startTimeZone").default(""),
  body("endTimeZone").isString().isLength({ max: 255 }).optional({ nullable: true }),
  body("endTimeZone").default(""),
  body("startTime").isISO8601().toDate().optional({ nullable: true }),
  body("endTime").isISO8601().toDate().optional({ nullable: true }),
  body("recurrenceException").isString().isLength({ max: 255 }).optional({ nullable: true }),
  body("recurrenceException").default(""),
  body("listId").isNumeric().optional({ nullable: true }),
  body("listId").default(null),
];

export const store = [
  ...validationArray,
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const data = matchedData(req);
    data.startTime ??= new Date();
    data.endTime ??= dayjs(data.startTime).add(1, "hour").toDate();

    // Voorkom dat een todo in iemand anders lijst wordt toegevoegd
    if (data.listId) {
      const list = (await req.session.user?.$get("lists"))?.find((l) => l.id === data.listId);
      if (!list) throw new DataValidationError("Lijst niet gevonden.");
    }

    await Todo.create({ ...data, userId: req.session.user?.id });
    broadcastTodos(req.session.user);
    res.json(true);
  }),
];

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  broadcastTodos(req.session.user);
  await Todo.destroy({ where: { id: req.params.todoId, userId: req.session.user?.id } });

  res.json(true);
});

export const update = [
  ...validationArray,
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const data = matchedData(req);
    // Voorkom dat een todo in iemand anders lijst wordt toegevoegd
    if (data.listId) {
      const list = (await req.session.user?.$get("lists"))?.find((l) => l.id === data.listId);
      if (!list) throw new DataValidationError("Lijst niet gevonden.");
    }

    await Todo.update(data, {
      where: { id: req.params.todoId, userId: req.session.user?.id },
    });
    broadcastTodos(req.session.user);
    res.json(true);
  }),
];

export const index = async (req: Request, res: Response) => {
  res.json(
    await req.session.user?.$get("todos", {
      order: [
        ["done", "ASC"],
        ["startTime", "ASC"],
      ],
    })
  );
};
