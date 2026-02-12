import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env"; 

interface JwtPayload {
  id: string;
  role: string;
}

// Extend Express Request globally
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1️⃣ Check Authorization header (Bearer token)
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // 2️⃣ Fallback: check cookies
  else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  // 3️⃣ No token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Not authorized, session missing" 
    });
  }

  try {
    // 4️⃣ Verify token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    // 5️⃣ Attach user to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification failed:", (err as Error).message);
    return res.status(401).json({ 
      success: false, 
      message: "Not authorized, token expired or invalid" 
    });
  }
};
