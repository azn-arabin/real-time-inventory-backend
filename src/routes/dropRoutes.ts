import { Router } from "express";
import {
  createDrop,
  getDrops,
  getDrop,
} from "../../controllers/dropController";

const router = Router();

router.post("/", createDrop);
router.get("/", getDrops);
router.get("/:id", getDrop);

export default router;
