import isLoggedIn from "@/middleware/auth";
import auth from "@/routes/auth";
import list from "@/routes/list";
import todo from "@/routes/todo";
import { Router } from "express";

const router = Router();

router.use("/auth", auth);
router.use("/lists", isLoggedIn, list);
router.use("/todos", isLoggedIn, todo);

export default router;
