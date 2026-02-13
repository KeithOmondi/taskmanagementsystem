import express, { Application, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet"; // ✅ Security headers

// Config & DB
import connectDB from "./config/db";
import { env } from "./config/env";

// Middleware
import { errorHandler, notFound } from "./middleware/errorHandler";

// Routes
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import adminTaskRoutes from "./routes/admin.task.routes";
import superAdminTaskRoutes from "./routes/superadmin.task.routes";
import userRoutes from "./routes/user.routes";
import categoriesRoutes from "./routes/category.routes";
import auditRoutes from "./routes/audit.routes";

dotenv.config();

const app: Application = express();

/* ==========================================
   1. SERVER & PROXY CONFIGURATION
========================================== */
const httpServer = createServer(app);
app.set("trust proxy", 1); // Required for secure cookies behind proxies

/* ==========================================
   2. GLOBAL SECURITY & MIDDLEWARE
========================================== */
// Apply Helmet early for all security headers
app.use(helmet());

// CORS must come before routes
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ==========================================
   3. SOCKET.IO SETUP
========================================== */
const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

/* ==========================================
   4. DATABASE CONNECTION
========================================== */
connectDB();

/* ==========================================
   5. HEALTH CHECK
========================================== */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "TMS API Gateway & WebSocket Server operational",
    version: "v1.1.0",
    environment: env.NODE_ENV,
  });
});

/* ==========================================
   6. API ROUTES
========================================== */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/admin/tasks", adminTaskRoutes);
app.use("/api/v1/superadmin/tasks", superAdminTaskRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/categories", categoriesRoutes);

/* ==========================================
   7. ERROR HANDLING
========================================== */
app.use(notFound);
app.use(errorHandler);

/* ==========================================
   8. TOKEN / COOKIE HELPERS
========================================== */
import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";

interface TokenPayload {
  id: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES as StringValue,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as string, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES as StringValue,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as string, options);
};

export const sendToken = (
  res: Response,
  user: { _id: any; role: string },
  statusCode = 200,
  message = "Authentication successful"
) => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const isProd = env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    path: "/",
  };

  res
    .status(statusCode)
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json({
      success: true,
      message,
      user: payload,
      accessToken, // optional for SPA
    });
};

/* ==========================================
   9. EXPORTS
========================================== */
export { app, httpServer, io };
