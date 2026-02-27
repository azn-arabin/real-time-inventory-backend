import { Router } from "express";
import { reserveItem, getUserReservation } from "../controllers/reservationController";

const router = Router();

router.post("/", reserveItem);
router.get("/", getUserReservation);

export default router;
