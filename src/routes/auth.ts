import { Router } from "express";
import * as AuthController from "@/controllers/auth";
import userdata from "@/routes/user";
import isLoggedIn from "@/middleware/auth";

const router = Router();

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.get("/logout", AuthController.logout);
router.post("/google", AuthController.google);

router.use("/user_data", isLoggedIn, userdata);

export default router;
