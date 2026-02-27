import { Request, Response } from "express";

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: Function,
) {
  console.error("Global error handler caught an error:", err);
  res.status(500).json({ error: "An unexpected error occurred" });
}
