import { Router } from "express";
import {
  reserveItem,
  getUserReservation,
} from "../controllers/reservationController";
import { anyUserAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", anyUserAuth, reserveItem);
router.get("/", anyUserAuth, getUserReservation);

export default router;
