import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { sendFailureResponse } from "../lib/helpers/responseHelper";
import { USER_ROLES } from "../lib/constants/utils.constants";
import User from "../models/User";

export interface AuthPayload {
  userId: string;
  role: "admin" | "user";
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    role: "admin" | "user";
  };
}

export const authorizationMiddleware = ({
  allowedRoles = Object.values(USER_ROLES),
}: {
  allowedRoles?: string[];
}) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const { authorization } = req.headers;

    if (!authorization) {
      return sendFailureResponse({
        res,
        statusCode: 401,
        message: "Authorization header is missing",
      });
    }

    try {
      const token = authorization.replace("Bearer ", "");
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;

      const dbUser = await User.findByPk(payload.userId);

      if (!dbUser) {
        return sendFailureResponse({
          res,
          statusCode: 401,
          message: "User not found or has been deleted",
        });
      }

      if (!allowedRoles.includes(dbUser.role)) {
        return sendFailureResponse({
          res,
          statusCode: 403,
          message: "You do not have permission to perform this action",
        });
      }

      req.user = {
        userId: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
      };

      return next();
    } catch (err) {
      console.error("Auth error:", err);
      return sendFailureResponse({
        res,
        statusCode: 401,
        message: "Invalid or expired token",
      });
    }
  };
};

// pre-built middleware shortcuts
export const anyUserAuth = authorizationMiddleware({}) as RequestHandler;

export const adminOnlyAuth = authorizationMiddleware({
  allowedRoles: ["admin"],
}) as RequestHandler;

export const userOnlyAuth = authorizationMiddleware({
  allowedRoles: ["user"],
}) as RequestHandler;
