import express from "express";
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  archiveTask,
  getOverdueTasks,
  reviewTask,
  getCompletedTasks, // Added
} from "../controllers/superadmin.task.Controller";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";
import { upload } from "../config/cloudinary";

const router = express.Router();

// Protect and authorize only superadmin for all routes below
router.use(protect);
router.use(authorizeRoles("superadmin"));

/**
 * @route   POST /api/v1/superadmin/tasks/create
 */
router.post("/create", upload.array("attachments", 5), createTask);

/**
 * @route   PUT /api/v1/superadmin/tasks/:id
 */
router.put("/:id", upload.array("attachments", 5), updateTask);

// Getters
router.get("/", getTasks);
router.get("/overdue", getOverdueTasks);
router.get("/submitted", getCompletedTasks); // Fetch tasks awaiting approval
router.get("/:id", getTask);

// Actions
/**
 * @route   PATCH /api/v1/superadmin/tasks/review/:id
 * @desc    Approve or Reject a submitted task
 */
router.patch("/review/:id", reviewTask);

router.delete("/:id", deleteTask);
router.put("/archive/:id", archiveTask);

export default router;
