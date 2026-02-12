import express, { Application, Request, Response } from "express";
import { createServer } from "http"; // Added
import { Server } from "socket.io";   // Added
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import { errorHandler, notFound } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import adminTaskRoutes from "./routes/admin.task.routes";
import superAdminTaskRoutes from "./routes/superadmin.task.routes";
import userRoutes from "./routes/user.routes";
import categoriesRoutes from "./routes/category.routes"
import auditRoutes from "./routes/audit.routes";
import { env } from "./config/env";
import cookieParser from "cookie-parser";

dotenv.config();

const app: Application = express(); 

/* ==========================================
    1. SOCKET.IO SETUP
   ========================================== */
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH"]
  }
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
    2. DATABASE CONNECTION
   ========================================== */
connectDB();

/* ==========================================
    3. MIDDLEWARE CONFIGURATION
   ========================================== */
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ==========================================
    4. API ROUTES
   ========================================== */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "TMS API Gateway & WebSocket Server operational",
    version: "v1.1.0"
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
    5. ERROR HANDLING
   ========================================== */
app.use(notFound);
app.use(errorHandler);

// Instead of export default app, we export the server
export { app, httpServer };