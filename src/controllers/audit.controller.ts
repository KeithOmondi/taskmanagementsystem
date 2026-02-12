import { Request, Response } from "express";
import ActivityLog from "../models/activityLog.model";
import { asyncHandler } from "../middleware/errorHandler";

export const getTaskAuditLogs = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskId } = req.params;

    const logs = await ActivityLog.find({
      entity: "TASK",
      entityId: taskId,
    })
      .populate("user", "name email role")
      .sort("-createdAt");

    res.json({ success: true, data: logs });
  },
);
