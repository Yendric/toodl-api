import * as ListController from "@/controllers/list";
import { Router } from "express";

const router = Router();

router.post("/", ListController.store);
router.delete("/:listId", ListController.destroy);
router.post("/:listId", ListController.update);
router.get("/", ListController.index);

export default router;
