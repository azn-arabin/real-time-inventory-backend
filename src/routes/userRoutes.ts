import { Router } from "express";
import {
  registerUser,
  getUser,
  loginUser,
} from "../../controllers/userController";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", getUser);

export default router;
