import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import {
  sendSuccessResponse,
  sendFailureResponse,
  sendFieldErrorResponse,
} from "../lib/helpers/responseHelper";

const signToken = (user: User) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    { userId: user.id, role: user.role } as jwt.JwtPayload,
    process.env.JWT_SECRET!,
    { expiresIn } as jwt.SignOptions,
  );
};

// register
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return sendFailureResponse({
        res,
        statusCode: 400,
        message: "username, email, and password are required",
      });
    }

    // check duplicates
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return sendFieldErrorResponse({
        res,
        statusCode: 409,
        message: "A user with this email already exists",
        field: "email",
      });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return sendFieldErrorResponse({
        res,
        statusCode: 409,
        message: "This username is already taken",
        field: "username",
      });
    }

    const user = await User.create({ username, email, password });

    // generate token right after registration
    const token = signToken(user);

    return sendSuccessResponse({
      res,
      statusCode: 201,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (err: any) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return sendFieldErrorResponse({
        res,
        statusCode: 409,
        message: "Username or email already taken",
        field: "email",
      });
    }
    console.error("registerUser error:", err);
    return sendFailureResponse({ res });
  }
};

// login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendFailureResponse({
        res,
        statusCode: 400,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return sendFailureResponse({
        res,
        statusCode: 401,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendFailureResponse({
        res,
        statusCode: 401,
        message: "Invalid email or password",
      });
    }

    const token = signToken(user);

    return sendSuccessResponse({
      res,
      message: "Logged in successfully",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return sendFailureResponse({ res });
  }
};

// get current user profile
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id as string, {
      attributes: ["id", "username", "email", "role", "createdAt"],
    });
    if (!user) {
      return sendFailureResponse({
        res,
        statusCode: 404,
        message: "User not found",
      });
    }
    return sendSuccessResponse({ res, data: user });
  } catch (err) {
    console.error("getUser error:", err);
    return sendFailureResponse({ res, message: "Failed to fetch user" });
  }
};
