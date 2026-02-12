import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import Task, { TaskStatus } from "../models/task.model";
import { addMissionMetrics, logActivity } from "./task.helpers";
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

/**
 * Local interface to override the generic JwtPayload conflict
 */
interface AuthUser {
  id: string;
  name: string;
  role: string;
  email?: string;
}

/* ============================================================
    EMAILING UTILITY (Placeholder)
============================================================ */
const sendTaskAssignmentEmail = async (users: any[], taskTitle: string, creatorName: string) => {
  try {
    // Logic for Nodemailer / SendGrid / Postmark goes here
    console.log(`📧 Email sent to ${users.length} users for task: ${taskTitle} by ${creatorName}`);
  } catch (error) {
    console.error("Failed to send assignment email:", error);
  }
};

/**
 * Helper: Generates temporary signed URLs for Cloudinary assets.
 */
const signTaskAttachments = (task: any) => {
  if (!task || !task.attachments || task.attachments.length === 0) return task;
  const taskObj = task.toObject ? task.toObject() : task;

  taskObj.attachments = taskObj.attachments.map((file: any) => ({
    ...file,
    url: cloudinary.url(file.publicId, {
      sign_url: true,
      type: "authenticated",
      resource_type: "auto",
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }),
  }));
  return taskObj;
};

/* ============================================================
   GET USER TASKS (With Real-Time Time Filters)
============================================================ */
export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const { timeframe, status } = req.query; 
  let dateFilter = {};
  const now = new Date();

  if (timeframe) {
    switch (timeframe) {
      case "yesterday":
        const yesterday = subDays(now, 1);
        dateFilter = { startDate: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) } };
        break;
      case "today":
        dateFilter = { startDate: { $gte: startOfDay(now), $lte: endOfDay(now) } };
        break;
      case "week":
        dateFilter = { startDate: { $gte: startOfWeek(now), $lte: endOfWeek(now) } };
        break;
      case "month":
        dateFilter = { startDate: { $gte: startOfMonth(now), $lte: endOfMonth(now) } };
        break;
    }
  }

  const query: any = { archivedAt: { $exists: false }, ...dateFilter };
  if (status) query.status = status;

  const tasks = await Task.find(query)
    .populate("assignedTo", "name email")
    .populate("category", "name parentId")
    .sort({ createdAt: -1 });

  const total = await Task.countDocuments(query);

  const processedTasks = tasks.map((task) => {
    const signedTask = signTaskAttachments(task) as any;
    return addMissionMetrics(signedTask);
  });

  res.json({ success: true, data: processedTasks, total });
});

/* ============================================================
   GET SINGLE TASK (Auto-Acknowledge Trigger)
============================================================ */
export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const task = await Task.findById(req.params.id).populate("assignedTo", "name email") as any;

  if (!task) {
    res.status(404);
    throw new Error("Objective not found");
  }

  if (task.status === TaskStatus.PENDING) {
    task.status = TaskStatus.ACKNOWLEDGED;
    task.acknowledgedAt = new Date();
    await task.save();

    await logActivity({
      userId: user.id,
      action: "TASK_ACKNOWLEDGED",
      taskId: task.id,
      meta: { method: "auto-read" },
    });
  }

  res.json({ success: true, data: signTaskAttachments(addMissionMetrics(task)) });
});

/* ============================================================
   COMPLETE TASK (Manual Action)
============================================================ */
export const completeTask = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const task = await Task.findOne({
    _id: req.params.id,
    assignedTo: user.id,
  }) as any;

  if (!task) {
    res.status(404);
    throw new Error("Task not found or unauthorized");
  }

  task.status = TaskStatus.COMPLETED;
  task.completedAt = new Date(); 
  await task.save();

  await logActivity({
    userId: user.id,
    action: "TASK_COMPLETED",
    taskId: task.id,
  });
  res.json({ success: true, data: signTaskAttachments(task) });
});

/* ============================================================
    ADMIN: CREATE TASK (Deployment Logic)
============================================================ */
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const attachments = (req.files as Express.Multer.File[])?.map((file) => ({
    name: file.originalname,
    url: file.path,
    fileType: file.mimetype,
    publicId: file.filename,
  })) || [];

  let { assignedTo, category, ...rest } = req.body;

  if (typeof assignedTo === "string") {
    try { assignedTo = JSON.parse(assignedTo); } 
    catch (e) { assignedTo = [assignedTo]; }
  }

  const task = await Task.create({
    ...rest,
    category: category || null,
    assignedTo,
    attachments,
    status: TaskStatus.PENDING,
    createdBy: user.id,
  });

  const populatedTask = await Task.findById(task._id)
    .populate("category", "name parentId")
    .populate("assignedTo", "name email") as any;

  if (!populatedTask) {
    res.status(404);
    throw new Error("Intelligence deployment failed: Record not found");
  }

  // 📧 Email triggered by casted user.name
  if (populatedTask.assignedTo && Array.isArray(populatedTask.assignedTo)) {
    await sendTaskAssignmentEmail(
      populatedTask.assignedTo, 
      populatedTask.title, 
      user.name || "Administrator"
    );
  }

  const taskWithMetrics = addMissionMetrics(populatedTask);

  await logActivity({
    userId: user.id,
    action: "TASK_CREATED",
    taskId: task.id,
  });

  res.status(201).json({ success: true, data: signTaskAttachments(taskWithMetrics) });
});

/* ============================================================
   ADMIN: REVIEW TASK
============================================================ */
export const reviewTask = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { action, feedback } = req.body;

  const task = await Task.findById(id) as any;
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  if (action === "APPROVE") {
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date(); 
  } else if (action === "REJECT") {
    task.status = TaskStatus.ACKNOWLEDGED;
    task.completedAt = undefined; 
  }

  await task.save();

  await logActivity({
    userId: user.id,
    action: `TASK_${action}`,
    taskId: task.id,
    meta: { feedback },
  });

  res.json({ success: true, data: signTaskAttachments(task) });
});

/* ============================================================
   REASSIGN TASK
============================================================ */
export const reassignTask = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { assignedTo, assignedTeams } = req.body;

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { 
      assignedTo, 
      assignedTeams,
      status: TaskStatus.PENDING,
      acknowledgedAt: null,
      completedAt: null 
    },
    { new: true }
  ).populate("category").populate("assignedTo", "name email") as any; 

  if (!task) {
    res.status(404);
    throw new Error("Objective not found");
  }

  if (task.assignedTo && Array.isArray(task.assignedTo)) {
    await sendTaskAssignmentEmail(task.assignedTo, task.title, user.name || "Administrator");
  }

  await logActivity({ userId: user.id, action: "TASK_REASSIGNED", taskId: task.id });

  res.json({ success: true, data: task });
});

/* ============================================================
    UPDATE TASK (Admin Full Control)
============================================================ */
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  
  // 1. Set completion timestamp if moving to COMPLETED status
  if (req.body.status === TaskStatus.COMPLETED && !req.body.completedAt) {
    req.body.completedAt = new Date();
  }

  // 2. Perform the update
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  ).populate("category").populate("assignedTo", "name email") as any;

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // 3. Log activity (This uses 'user.id', resolving the TS unused variable error)
  await logActivity({ 
    userId: user.id, 
    action: "TASK_UPDATED", 
    taskId: task.id 
  });

  const taskWithMetrics = addMissionMetrics(task);
  res.json({ success: true, data: taskWithMetrics });
});

/* ============================================================
   FETCH COMPLETED TASKS
============================================================ */
export const getCompletedTasks = asyncHandler(async (_req: Request, res: Response) => {
  const tasks = await Task.find({ 
    status: TaskStatus.COMPLETED, 
    archivedAt: { $exists: false } 
  })
  .populate("category")
  .populate("assignedTo", "name email")
  .sort({ completedAt: -1 });

  res.json({ success: true, data: tasks });
});

/* ============================================================
   DELETE & ARCHIVE
============================================================ */
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) { res.status(404); throw new Error("Task not found"); }
  await logActivity({ userId: user.id, action: "TASK_DELETED", taskId: req.params.id as string });
  res.json({ success: true, message: "Objective purged from registry" });
});

export const archiveTask = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { archivedAt: new Date(), archivedBy: user.id, status: "Archived" },
    { new: true }
  );
  if (!task) { res.status(404); throw new Error("Task not found"); }
  await logActivity({ userId: user.id, action: "TASK_ARCHIVED", taskId: task.id });
  res.json({ success: true, data: task });
});

/* ============================================================
   KANBAN & TIME TRACKING
============================================================ */

export const moveTaskColumn = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { boardColumn: req.body.column, sortOrder: req.body.sortOrder },
    { new: true }
  ).populate("category");
  res.json({ success: true, data: task });
});

export const addTimeLog = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $push: { timeLogs: { userId: user.id, ...req.body } } },
    { new: true }
  ).populate("category");
  res.json({ success: true, data: task });
});


/* ============================================================
   FETCH OVERDUE TASKS
============================================================ */
export const getOverdueTasks = asyncHandler(async (_req: Request, res: Response) => {
  const tasks = await Task.find({
    endDate: { $lt: new Date() },
    status: { $nin: [TaskStatus.COMPLETED, "Archived"] },
    archivedAt: { $exists: false },
  }).populate("category").populate("assignedTo", "name email");

  // Process metrics for overdue tasks
  const processedTasks = tasks.map((task) => {
    const signedTask = signTaskAttachments(task) as any;
    return addMissionMetrics(signedTask);
  });

  res.json({ success: true, data: processedTasks });
});