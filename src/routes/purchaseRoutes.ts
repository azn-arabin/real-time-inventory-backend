import { Router } from "express";
import {
  completePurchase,
  getMyPurchases,
} from "../controllers/purchaseController";
import { anyUserAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", anyUserAuth, completePurchase);
router.get("/mine", anyUserAuth, getMyPurchases);

export default router;
