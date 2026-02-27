import { Router } from "express";
import { createDrop, getDrops, getDrop } from "../controllers/dropController";
import { adminOnlyAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", adminOnlyAuth, createDrop);
router.get("/", getDrops); // public - dashboard needs this
router.get("/:id", getDrop);

export default router;
