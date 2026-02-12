import express from "express";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";
import { getTaskAuditLogs } from "../controllers/audit.controller";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("superadmin"));

router.get("/tasks/:taskId", getTaskAuditLogs);

export default router;
