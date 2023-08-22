import * as UserController from "@/controllers/user";
import { Router } from "express";

const router = Router();

router.get("/", UserController.info);
router.post("/", UserController.update);
router.post("/destroy", UserController.destroy);
router.post("/update_password", UserController.updatePassword);

export default router;
