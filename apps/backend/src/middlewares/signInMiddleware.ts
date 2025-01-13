import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export function signInMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers["authorization"] ?? "";

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return; // Prevent further execution
  }

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decodedToken.userId; // Extend `Request` to include `userId`
    next(); // Proceed to the next middleware or route
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
}
