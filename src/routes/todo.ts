import { Router } from "express";
import * as TodoController from "@/controllers/todo";

const router = Router();

router.post("/", TodoController.store);
router.delete("/:todoId", TodoController.destroy);
router.post("/:todoId", TodoController.update);
router.get("/", TodoController.index);

export default router;
