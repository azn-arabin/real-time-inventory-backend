import { Request, Response } from "express";
import { Drop, Purchase, User } from "../models";

// create a new merch drop (admin API)
export const createDrop = async (req: Request, res: Response) => {
  try {
    const { name, price, totalStock, imageUrl, dropStartsAt } = req.body;

    if (!name || price == null || !totalStock) {
      res.status(400).json({ error: "name, price, and totalStock are required" });
      return;
    }

    const drop = await Drop.create({
      name,
      price,
      totalStock,
      availableStock: totalStock, // initially all stock is available
      imageUrl: imageUrl || null,
      dropStartsAt: dropStartsAt || new Date(),
    });

    res.status(201).json(drop);
  } catch (err) {
    console.error("createDrop error:", err);
    res.status(500).json({ error: "failed to create drop" });
  }
};

// get all active drops with latest 3 purchasers
export const getDrops = async (req: Request, res: Response) => {
  try {
    const drops = await Drop.findAll({
      order: [["createdAt", "DESC"]],
    });

    // for each drop, get the 3 most recent purchases
    const dropsWithPurchasers = await Promise.all(
      drops.map(async (drop) => {
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
          recentPurchasers: recentPurchases.map((p: any) => ({
            username: p.User?.username,
            purchasedAt: p.createdAt,
          })),
        };
      })
    );

    res.json(dropsWithPurchasers);
  } catch (err) {
    console.error("getDrops error:", err);
    res.status(500).json({ error: "failed to fetch drops" });
  }
};

// get single drop
export const getDrop = async (req: Request, res: Response) => {
  try {
    const drop = await Drop.findByPk(req.params.id);
    if (!drop) {
      res.status(404).json({ error: "drop not found" });
      return;
    }
    res.json(drop);
  } catch (err) {
    console.error("getDrop error:", err);
    res.status(500).json({ error: "failed to fetch drop" });
  }
};
