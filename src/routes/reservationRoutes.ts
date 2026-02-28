import { Router } from "express";
import {
  reserveItem,
  getUserReservations,
} from "../controllers/reservationController";
import { anyUserAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", anyUserAuth, reserveItem);
router.get("/", anyUserAuth, getUserReservations);

export default router;
