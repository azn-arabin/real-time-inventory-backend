import { Response } from "express";
import { Drop, Purchase, Reservation, User } from "../models";
import sequelize from "../lib/config/database";
import { getIO } from "../socket";
import { SOCKET_EVENTS } from "../lib/constants/utils.constants";
import {
  sendSuccessResponse,
  sendFailureResponse,
} from "../lib/helpers/responseHelper";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

// complete purchase - user must have an active reservation
export const completePurchase = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = req.user!.userId;
  const { reservationId } = req.body;

  if (!reservationId) {
    return sendFailureResponse({
      res,
      statusCode: 400,
      message: "reservationId is required",
    });
  }

  const t = await sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(reservationId, {
      transaction: t,
    });

    if (!reservation) {
      await t.rollback();
      return sendFailureResponse({
        res,
        statusCode: 404,
        message: "Reservation not found",
      });
    }

    if (reservation.userId !== userId) {
      await t.rollback();
      return sendFailureResponse({
        res,
        statusCode: 403,
        message: "This reservation doesn't belong to you",
      });
    }

    if (reservation.status !== "active") {
      await t.rollback();
      return sendFailureResponse({
        res,
        statusCode: 410,
        message: "Reservation has expired or already been used",
      });
    }

    // double-check expiry by time
    // dont mark it expired here - let the schdeuler handle status + stock return
    if (new Date() > reservation.expiresAt) {
      await t.rollback();
      return sendFailureResponse({
        res,
        statusCode: 410,
        message: "Reservation has expired",
      });
    }

    // mark reservation completed
    reservation.status = "completed";
    await reservation.save({ transaction: t });

    // create purchase
    const purchase = await Purchase.create(
      {
        userId,
        dropId: reservation.dropId,
        reservationId: reservation.id,
      },
      { transaction: t },
    );

    await t.commit();

    // broadcast purchase to all clients
    const io = getIO();
    const user = await User.findByPk(userId);
    io.emit(SOCKET_EVENTS.PURCHASE_UPDATE, {
      dropId: reservation.dropId,
      username: user?.username || "unknown",
      purchasedAt: purchase.createdAt,
    });

    return sendSuccessResponse({
      res,
      statusCode: 201,
      message: "Purchase completed",
      data: purchase,
    });
  } catch (err) {
    await t.rollback();
    console.error("completePurchase error:", err);
    return sendFailureResponse({ res, message: "Purchase failed" });
  }
};

// get all purschases for the logged in user
export const getMyPurchases = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.userId;

    const purchases = await Purchase.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Drop,
          attributes: ["id", "name", "price", "imageUrl"],
        },
      ],
    });

    return sendSuccessResponse({ res, data: purchases });
  } catch (err) {
    console.error("getMyPurchases error:", err);
    return sendFailureResponse({ res, message: "Failed to get purchases" });
  }
};
