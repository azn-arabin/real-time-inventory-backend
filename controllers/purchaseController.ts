import { Request, Response } from "express";
import { Drop, Purchase, Reservation } from "../models";
import sequelize from "../config/database";

// complete purchase - only if user has an active reservation
export const completePurchase = async (req: Request, res: Response) => {
  const { userId, reservationId } = req.body;

  if (!userId || !reservationId) {
    res.status(400).json({ error: "userId and reservationId required" });
    return;
  }

  const t = await sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(reservationId, {
      transaction: t,
    });

    if (!reservation) {
      await t.rollback();
      res.status(404).json({ error: "reservation not found" });
      return;
    }

    if (reservation.userId !== userId) {
      await t.rollback();
      res.status(403).json({ error: "this reservation doesn't belong to you" });
      return;
    }

    if (reservation.status !== "active") {
      await t.rollback();
      res.status(410).json({ error: "reservation has expired or already been used" });
      return;
    }

    // check if it's expired by time
    if (new Date() > reservation.expiresAt) {
      reservation.status = "expired";
      await reservation.save({ transaction: t });
      await t.rollback();
      res.status(410).json({ error: "reservation has expired" });
      return;
    }

    // mark reservation as completed
    reservation.status = "completed";
    await reservation.save({ transaction: t });

    // create the purchase record
    const purchase = await Purchase.create(
      {
        userId,
        dropId: reservation.dropId,
        reservationId: reservation.id,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json(purchase);
  } catch (err) {
    await t.rollback();
    console.error("completePurchase error:", err);
    res.status(500).json({ error: "purchase failed" });
  }
};
