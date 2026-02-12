import { Request, Response } from "express";
import Task from "../models/task.model";
import { logActivity } from "./task.helpers";
import { asyncHandler } from "../middleware/errorHandler";

/* ============================================================
   REASSIGN TASK
============================================================ */
/* ============================================================
    REASSIGN TASK
============================================================ */
export const reassignTask = asyncHandler(async (req: Request, res: Response) => {
  const { assignedTo, assignedTeams } = req.body;

  // Added .populate("category") so the frontend grouping doesn't break
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { assignedTo, assignedTeams },
    { new: true }
  ).populate("category").populate("assignedTo", "name role"); 

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  await logActivity({
    userId: (req as any).user.id, // Type cast if user is missing on Request type
    action: "TASK_REASSIGNED",
    taskId: task.id,
  });

  res.json({ success: true, data: task });
});
/* ============================================================
   MOVE KANBAN COLUMN
============================================================ */
export const moveTaskColumn = asyncHandler(
  async (req: Request, res: Response) => {
    const { column, sortOrder } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { boardColumn: column, sortOrder },
      { new: true },
    );

    res.json({ success: true, data: task });
  },
);

/* ============================================================
   TIME TRACKING
============================================================ */
export const addTimeLog = asyncHandler(async (req: Request, res: Response) => {
  const { startedAt, endedAt, durationMinutes } = req.body;

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        timeLogs: {
          userId: req.user!.id,
          startedAt,
          endedAt,
          durationMinutes,
        },
      },
    },
    { new: true },
  );

  res.json({ success: true, data: task });
});
