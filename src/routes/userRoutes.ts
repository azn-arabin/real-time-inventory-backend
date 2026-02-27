import { Router } from "express";
import {
  registerUser,
  getUser,
  loginUser,
} from "../controllers/authController";
import { anyUserAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", anyUserAuth, getUser);

export default router;
