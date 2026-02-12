import { Request, Response } from "express";
import Task, { TaskStatus, ITask } from "../models/task.model";
import {
  addMissionMetrics,
  logActivity,
  validateDependenciesCompleted,
} from "./task.helpers";
import { asyncHandler } from "../middleware/errorHandler";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import sendMail from "../utils/sendMail";
import { mailTemplates } from "../utils/mailTemplates";

/* ---------------- HELPERS ---------------- */

const getDeadlineFilter = (timeframe: string) => {
  const now = new Date();
  const ranges: Record<string, { $gte: Date; $lte: Date }> = {
    yesterday: {
      $gte: startOfDay(subDays(now, 1)),
      $lte: endOfDay(subDays(now, 1)),
    },
    today: { $gte: startOfDay(now), $lte: endOfDay(now) },
    week: { $gte: startOfWeek(now), $lte: endOfWeek(now) },
    month: { $gte: startOfMonth(now), $lte: endOfMonth(now) },
  };
  return ranges[timeframe] ? { dueDate: ranges[timeframe] } : {};
};

const emitTaskUpdate = (req: Request, task: ITask) => {
  const io = req.app.get("io");
  if (io) io.emit("task_updated", addMissionMetrics(task));
};

/* ---------------- CONTROLLERS ---------------- */

/**
 * @desc    Get user tasks with filters
 * @route   GET /api/tasks
 */
export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const { timeframe, status, priority } = req.query;
  const userId = req.user!.id;

  const filter: any = {
    assignedTo: userId,
    status: { $ne: TaskStatus.ARCHIVED },
    ...(timeframe && getDeadlineFilter(timeframe as string)),
  };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("category", "name")
      .sort("-priority dueDate")
      .lean(), // Use lean for performance if not saving later
    Task.countDocuments(filter),
  ]);

  const data = tasks.map((t) => addMissionMetrics(t as unknown as ITask));
  res.json({ success: true, total, data });
});

/**
 * @desc    Get single task & Auto-Acknowledge
 * @route   GET /api/tasks/:id
 */
export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOne({
    _id: req.params.id,
    assignedTo: req.user!.id,
  })
    .populate("assignedTo", "name email")
    .populate("category", "name")
    .populate("createdBy", "name email");

  if (!task) {
    res.status(404);
    throw new Error("Objective not found in your sector");
  }

  // Handle Automatic Acknowledgment
  if (task.status === TaskStatus.PENDING) {
    task.status = TaskStatus.ACKNOWLEDGED;
    task.acknowledgedAt = new Date();
    await task.save();

    // Notify via Mail (Async - don't await)
    const assignee = (task.assignedTo as any)[0];
    const admin = task.createdBy as any;

    if (assignee?.email && admin?.email) {
      sendMail({
        email: admin.email,
        ...mailTemplates.taskAcknowledgedAdmin(task.title, assignee.name),
      }).catch(console.error);
      sendMail({
        email: assignee.email,
        ...mailTemplates.taskAcknowledgedUser(task.title, assignee.name),
      }).catch(console.error);
    }

    emitTaskUpdate(req, task);
    await logActivity({
      userId: req.user!.id,
      action: "TASK_ACKNOWLEDGED",
      taskId: task.id,
      meta: { auto: true },
    });
  }

  res.json({ success: true, data: addMissionMetrics(task) });
});

/**
 * @desc    Update task status/details
 * @route   PATCH /api/tasks/:id
 */
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOne({
    _id: req.params.id,
    assignedTo: req.user!.id,
  }).populate("assignedTo createdBy");

  if (!task) {
    res.status(404);
    throw new Error("Unauthorized access to mission data");
  }

  const { status, boardColumn, description } = req.body;

  // Validation for Completion Protocol
  if (status === TaskStatus.COMPLETED) {
    if (task.status === TaskStatus.PENDING) {
      res.status(400);
      throw new Error("Protocol Error: Acknowledge briefing before completion");
    }

    const isBlocked = !(await validateDependenciesCompleted(task.id));
    if (isBlocked) {
      res.status(400);
      throw new Error("Blocked: Prerequisite objectives outstanding");
    }

    task.completedAt = new Date();

    // Notify Admin of completion
    const admin = task.createdBy as any;
    const assignee = (task.assignedTo as any)[0];
    if (admin?.email) {
      sendMail({
        email: admin.email,
        ...mailTemplates.taskCompletedAdmin(task.title, assignee.name),
      }).catch(console.error);
    }
  }

  // Apply updates
  if (status) task.status = status;
  if (boardColumn) task.boardColumn = boardColumn;
  if (description) task.description = description;

  await task.save();
  // Ensure we get populated fields back for the UI
  const updatedTask = await task.populate("category assignedTo");

  emitTaskUpdate(req, updatedTask);
  await logActivity({
    userId: req.user!.id,
    action: status === TaskStatus.COMPLETED ? "TASK_COMPLETED" : "TASK_UPDATED",
    taskId: task.id,
  });

  res.json({ success: true, data: addMissionMetrics(updatedTask) });
});

/**
 * @desc    Quick update for Kanban/Time logs
 */
export const moveTaskColumn = asyncHandler(
  async (req: Request, res: Response) => {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedTo: req.user!.id },
      { boardColumn: req.body.column },
      { new: true, runValidators: true },
    ).populate("category assignedTo");

    if (!task) throw new Error("Access denied");

    emitTaskUpdate(req, task);
    res.json({ success: true, data: addMissionMetrics(task) });
  },
);

export const addTimeLog = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, assignedTo: req.user!.id },
    { $push: { timeLogs: { ...req.body, userId: req.user!.id } } },
    { new: true },
  ).populate("category assignedTo");

  if (!task) throw new Error("Access denied");

  emitTaskUpdate(req, task);
  res.json({ success: true, data: addMissionMetrics(task) });
});
