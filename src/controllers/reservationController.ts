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

  // use READ COMMITTED + row lock so transactions queue up
  const t = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {
    // lock the drop row so no other transaction can modify it concurently
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
    console.error("reserveItem error:", err);
    return sendFailureResponse({
      res,
      message: "Reservation failed, please try again",
    });
  }
};

// get ALL active reservations for the current user
export const getUserReservations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.userId;

    const reservations = await Reservation.findAll({
      where: { userId, status: "active" },
      order: [["createdAt", "DESC"]],
    });

    // filter out any that have already expired but scheduler hasnt cleaned up yet
    const active = reservations.filter(
      (r) => new Date(r.expiresAt) > new Date(),
    );

    return sendSuccessResponse({ res, data: active });
  } catch (err) {
    console.error("getUserReservations error:", err);
    return sendFailureResponse({ res });
  }
};
