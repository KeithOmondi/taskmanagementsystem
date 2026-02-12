import express from "express";
import {
  reassignTask,
  moveTaskColumn,
  addTimeLog,
} from "../controllers/admin.task.Controller";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin", "superadmin"));

router.patch("/:id/reassign", reassignTask);
router.patch("/:id/move", moveTaskColumn);
router.post("/:id/time-log", addTimeLog);

export default router;
