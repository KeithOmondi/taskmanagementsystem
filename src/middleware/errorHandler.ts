import { Request, Response, NextFunction } from "express";

interface ErrorWithStatus extends Error {
  status?: number;
}

// 1. HELPER: Wrap async routes so you don't need try-catch
export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// 2. 404 HANDLER: Catch routes that don't exist
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error: ErrorWithStatus = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// 3. GLOBAL ERROR HANDLER: Formats all errors into JSON
export const errorHandler = (
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false, // Useful for frontend logic
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
