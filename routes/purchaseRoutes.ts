import { Router } from "express";
import { completePurchase } from "../controllers/purchaseController";

const router = Router();

router.post("/", completePurchase);

export default router;
