import { Request, Response } from "express";
import { Drop, Purchase, User } from "../models";
import {
  sendSuccessResponse,
  sendFailureResponse,
} from "../lib/helpers/responseHelper";
import { paginate } from "../lib/helpers/paginationHelper";

// create a new merch drop (admin only)
export const createDrop = async (req: Request, res: Response) => {
  try {
    const { name, price, totalStock, imageUrl, dropStartsAt } = req.body;

    if (!name || price == null || !totalStock) {
      return sendFailureResponse({
        res,
        statusCode: 400,
        message: "name, price, and totalStock are required",
      });
    }

    const drop = await Drop.create({
      name,
      price,
      totalStock,
      availableStock: totalStock,
      imageUrl: imageUrl || null,
      dropStartsAt: dropStartsAt || new Date(),
    });

    return sendSuccessResponse({
      res,
      statusCode: 201,
      message: "Drop created",
      data: drop,
    });
  } catch (err) {
    console.error("createDrop error:", err);
    return sendFailureResponse({ res, message: "Failed to create drop" });
  }
};

// get all drops (paginated) with latest 3 purchasers per drop
export const getDrops = async (req: Request, res: Response) => {
  try {
    const { page, pageSize } = req.query;

    const result = await paginate(Drop, {
      page: page as string,
      pageSize: pageSize as string,
      order: [["createdAt", "DESC"]],
    });

    // attach recent purchasers for each drop
    const dropsWithPurchasers = await Promise.all(
      result.items.map(async (drop) => {
        const recentPurchases = await Purchase.findAll({
          where: { dropId: drop.id },
          order: [["createdAt", "DESC"]],
          limit: 3,
          include: [
            {
              model: User,
              attributes: ["id", "username"],
            },
          ],
        });

        return {
          ...drop.toJSON(),
          topPurchasers: recentPurchases.map((p: any) => ({
            username: p.User?.username || "unknown",
            purchasedAt: p.createdAt,
          })),
        };
      }),
    );

    return sendSuccessResponse({
      res,
      data: dropsWithPurchasers,
      meta: result.meta,
    });
  } catch (err) {
    console.error("getDrops error:", err);
    return sendFailureResponse({ res, message: "Failed to fetch drops" });
  }
};

// get single drop by id - also includes top 3 purchasers
export const getDrop = async (req: Request, res: Response) => {
  try {
    const drop = await Drop.findByPk(req.params.id as string);
    if (!drop) {
      return sendFailureResponse({
        res,
        statusCode: 404,
        message: "Drop not found",
      });
    }

    // fetch top 3 recent purchasers for this drop
    const recentPurchases = await Purchase.findAll({
      where: { dropId: drop.id },
      order: [["createdAt", "DESC"]],
      limit: 3,
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
    });

    const dropData = {
      ...drop.toJSON(),
      topPurchasers: recentPurchases.map((p: any) => ({
        username: p.User?.username || "unknown",
        purchasedAt: p.createdAt,
      })),
    };

    return sendSuccessResponse({ res, data: dropData });
  } catch (err) {
    console.error("getDrop error:", err);
    return sendFailureResponse({ res, message: "Failed to fetch drop" });
  }
};
