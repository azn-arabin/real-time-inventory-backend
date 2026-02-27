import { Request, Response } from "express";
import { Drop, Reservation } from "../models";
import sequelize from "../lib/config/database";
import { Transaction } from "sequelize";
import { getIO } from "../socket";

const RESERVATION_TTL = 60 * 1000; // 60 seconds

// reserve an item - atomic, prevents overselling
export const reserveItem = async (req: Request, res: Response) => {
  const { userId, dropId } = req.body;

  if (!userId || !dropId) {
    res.status(400).json({ error: "userId and dropId are required" });
    return;
  }

  // check if user already has an active reservation for this drop
  const existingReservation = await Reservation.findOne({
    where: { userId, dropId, status: "active" },
  });
  if (existingReservation) {
    res
      .status(409)
      .json({ error: "you already have an active reservation for this item" });
    return;
  }

  // use a transaction with row-level locking
  const t = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    // lock the row so no other transaction can read/modify it
    const drop = await Drop.findByPk(dropId, {
      lock: Transaction.LOCK.UPDATE,
      transaction: t,
    });

    if (!drop) {
      await t.rollback();
      res.status(404).json({ error: "drop not found" });
      return;
    }

    if (drop.availableStock <= 0) {
      await t.rollback();
      res.status(409).json({ error: "out of stock" });
      return;
    }

    // decrement available stock
    drop.availableStock -= 1;
    await drop.save({ transaction: t });

    // create the reservation
    const expiresAt = new Date(Date.now() + RESERVATION_TTL);
    const reservation = await Reservation.create(
      { userId, dropId, status: "active", expiresAt },
      { transaction: t },
    );

    await t.commit();

    // broadcast stock update to all clients
    const io = getIO();
    io.emit("stock-update", {
      dropId: drop.id,
      availableStock: drop.availableStock,
    });

    res.status(201).json({
      reservation,
      availableStock: drop.availableStock,
    });
  } catch (err: any) {
    await t.rollback();
    // serialization failure = another transaction got there first
    if (err.parent?.code === "40001") {
      res
        .status(409)
        .json({ error: "someone else grabbed it first, try again" });
      return;
    }
    console.error("reserveItem error:", err);
    res.status(500).json({ error: "reservation failed" });
  }
};

// get active reservation for a user on a specific drop
export const getUserReservation = async (req: Request, res: Response) => {
  try {
    const { userId, dropId } = req.query;

    const reservation = await Reservation.findOne({
      where: {
        userId: userId as string,
        dropId: dropId as string,
        status: "active",
      },
    });

    if (!reservation) {
      res.status(404).json({ error: "no active reservation" });
      return;
    }

    res.json(reservation);
  } catch (err) {
    console.error("getUserReservation error:", err);
    res.status(500).json({ error: "failed to fetch reservation" });
  }
};
