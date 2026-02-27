import { Router } from "express";
import { completePurchase } from "../controllers/purchaseController";
import { anyUserAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", anyUserAuth, completePurchase);

export default router;
