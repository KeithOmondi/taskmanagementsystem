import { Request, Response, NextFunction } from "express";

/**
 * Middleware to restrict access based on user roles.
 * Supports multiple roles: authorizeRoles("admin", "superadmin")
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Check if user exists (should have been populated by 'protect' middleware)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // 2. Check if user's role is included in the permitted roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not authorized to access this resource`
      });
    }

    next();
  };
};