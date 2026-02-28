import { Response } from "express";
import { Drop, Reservation } from "../models";
import sequelize from "../lib/config/database";
import { Transaction } from "sequelize";
import { getIO } from "../socket";
import { SOCKET_EVENTS } from "../lib/constants/utils.constants";
import {
  sendSuccessResponse,
  sendFailureResponse,
} from "../lib/helpers/responseHelper";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

const RESERVATION_TTL = 60 * 1000; // 60 seconds

// reserve an item - atomic, prevents overselling
export const reserveItem = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { dropId } = req.body;

  if (!dropId) {
    return sendFailureResponse({
      res,
      statusCode: 400,
      message: "dropId is required",
    });
  }

  // check if user already has an active reservation for this drop
  const existingReservation = await Reservation.findOne({
    where: { userId, dropId, status: "active" },
  });
  if (existingReservation) {
    return sendFailureResponse({
      res,
      statusCode: 409,
      message: "You already have an active reservation for this item",
    });
  }

  // use a transaction with row-level locking
  const t = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    // lock the drop row so no other transaction can modify it
    const drop = await Drop.findByPk(dropId, {
      lock: Transaction.LOCK.UPDATE,
      transaction: t,
    });

    if (!drop) {
      await t.rollback();
      return sendFailureResponse({
        res,
        statusCode: 404,
        message: "Drop not found",
      });
    }

    if (drop.availableStock <= 0) {
      await t.rollback();
      return sendFailureResponse({
        res,
        statusCode: 409,
        message: "Out of stock",
      });
    }

    // decrement stock
    drop.availableStock -= 1;
    await drop.save({ transaction: t });

    // create reservation with 60s TTL
    const expiresAt = new Date(Date.now() + RESERVATION_TTL);
    const reservation = await Reservation.create(
      { userId, dropId, status: "active", expiresAt },
      { transaction: t },
    );

    await t.commit();

    // notify all connected clients
    const io = getIO();
    io.emit(SOCKET_EVENTS.INVENTORY_UPDATE, {
      dropId: drop.id,
      availableStock: drop.availableStock,
    });

    return sendSuccessResponse({
      res,
      statusCode: 201,
      message: "Item reserved for 60 seconds",
      data: {
        reservation,
        availableStock: drop.availableStock,
      },
    });
  } catch (err: any) {
    await t.rollback();
    // serialization failure means another transaction beat us
    if (err.parent?.code === "40001") {
      return sendFailureResponse({
        res,
        statusCode: 409,
        message: "Someone else grabbed it first, try again",
      });
    }
    console.error("reserveItem error:", err);
    return sendFailureResponse({ res, message: "Reservation failed" });
  }
};

// get active reservation for current user on a specific drop
export const getUserReservation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.userId;
    const { dropId } = req.query;

    const where: any = { userId, status: "active" };
    if (dropId) where.dropId = dropId as string;

    const reservation = await Reservation.findOne({ where });

    if (!reservation) {
      return sendFailureResponse({
        res,
        statusCode: 404,
        message: "No active reservation found",
      });
    }

    return sendSuccessResponse({ res, data: reservation });
  } catch (err) {
    console.error("getUserReservation error:", err);
    return sendFailureResponse({ res });
  }
};
