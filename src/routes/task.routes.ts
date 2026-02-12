import express from "express";
import {
  getTasks,
  getTask,
  updateTask,
} from "../controllers/task.controller";
import { 
  moveTaskColumn, 
  addTimeLog 
} from "../controllers/task.controller"; 
import { protect } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(protect);

/* ==========================================
   USER WORKSPACE (Execution Only)
   ========================================== */

// GET: View tasks assigned to the logged-in user
router.get("/get", getTasks);

// GET: View details of a specific assigned task
router.get("/get/:id", getTask);

// PUT: Update progress/status of an assigned task
router.put("/update/:id", updateTask);

/* ==========================================
   USER ACTIONS
   ========================================== */

// PATCH: Move task within the Kanban board
router.patch("/move/:id/move", moveTaskColumn);

// POST: Log work hours/time spent
router.post("/add/:id/time-logs", addTimeLog);

export default router;