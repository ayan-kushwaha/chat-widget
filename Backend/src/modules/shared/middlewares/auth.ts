import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header) {
    // console.log("❌ Auth Middleware: Missing Authorization header");
    return res.status(401).json({ message: "Missing token" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Auth Middleware: Token verification failed:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * OPTIONAL AUTH: Tries to populate user if token exists, but doesn't block request.
 */
export const tryAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header) {
    return next(); // Guest
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
  } catch (err) {
    // Token invalid/expired? Just treat as guest.
    // console.warn("tryAuth: Invalid token, proceeding as guest");
  }
  next();
};
