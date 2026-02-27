import { Request, Response } from "express";
import { User } from "../models";

// register a new user (simple, no auth for now)
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      res.status(400).json({ error: "username and email are required" });
      return;
    }

    // check if user already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "user with this email already exists" });
      return;
    }

    const user = await User.create({ username, email });
    res.status(201).json(user);
  } catch (err: any) {
    // handle unique constraint
    if (err.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({ error: "username or email already taken" });
      return;
    }
    console.error("registerUser error:", err);
    res.status(500).json({ error: "something went wrong" });
  }
};

// get user by id
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ error: "user not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error("getUser error:", err);
    res.status(500).json({ error: "something went wrong" });
  }
};

// login - just find by email, return user (no passwords for this demo)
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: "no user found with that email" });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error("loginUser error:", err);
    res.status(500).json({ error: "something went wrong" });
  }
};
