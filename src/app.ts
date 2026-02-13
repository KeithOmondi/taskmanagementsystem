import express, { Application, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Configurations & Database
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

/**
 * 🟢 CRITICAL FOR RENDER/VERCEL:
 * Tells Express to trust the reverse proxy headers (X-Forwarded-Proto).
 * Without this, secure cookies (secure: true) will not be sent because
 * Express thinks the connection is insecure HTTP.
 */
app.set("trust proxy", 1);

/* ==========================================
    2. SOCKET.IO SETUP
   ========================================== */
const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH"],
  },
});

// Attach io to app so it can be accessed in controllers via req.app.get("io")
app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Personnel connected to Registry:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Personnel disconnected");
  });
});

/* ==========================================
    3. DATABASE CONNECTION
   ========================================== */
connectDB();

/* ==========================================
    4. GLOBAL MIDDLEWARE
   ========================================== */
// 🟢 CORS must come before routes
app.use(
  cors({
    origin: env.FRONTEND_URL, // Ensure this is https://your-app.vercel.app
    credentials: true,       // Allows cookies to be sent over cross-origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 🟢 COOKIE PARSER:
 * Must be defined before any routes that attempt to read req.cookies.
 */
app.use(cookieParser());

/* ==========================================
    5. API ROUTES
   ========================================== */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "TMS API Gateway & WebSocket Server operational",
    version: "v1.1.0",
    environment: env.NODE_ENV
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/admin/tasks", adminTaskRoutes);
app.use("/api/v1/superadmin/tasks", superAdminTaskRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/categories", categoriesRoutes);

/* ==========================================
    6. ERROR HANDLING
   ========================================== */
app.use(notFound);
app.use(errorHandler);

// Exporting both for the entry point (usually server.ts or index.ts)
export { app, httpServer };