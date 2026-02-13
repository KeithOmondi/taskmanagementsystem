import express, { Application, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";

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

// Required for secure cookies behind reverse proxies (Render, Railway, etc.)
app.set("trust proxy", 1);

/* ==========================================
   2. GLOBAL SECURITY & MIDDLEWARE
========================================== */
app.use(helmet());

/* ==========================================
   3. CORS CONFIGURATION (DEV + PROD SAFE)
========================================== */

const allowedOrigins = [
  "http://localhost:5173",      // CRA fallback
  env.FRONTEND_URL,             // Production frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow Postman / server-to-server

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ==========================================
   4. SOCKET.IO SETUP
========================================== */
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
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
   5. DATABASE CONNECTION
========================================== */
connectDB();

/* ==========================================
   6. HEALTH CHECK
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
   7. API ROUTES
========================================== */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/admin/tasks", adminTaskRoutes);
app.use("/api/v1/superadmin/tasks", superAdminTaskRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/categories", categoriesRoutes);

/* ==========================================
   8. ERROR HANDLING
========================================== */
app.use(notFound);
app.use(errorHandler);

/* ==========================================
   9. EXPORTS
========================================== */
export { app, httpServer, io };
