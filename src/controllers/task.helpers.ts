import activityLogModel from "../models/activityLog.model";
import Task, { TaskStatus } from "../models/task.model";

/* ============================================================
   ACTIVITY LOGGER
============================================================ */
export const logActivity = async ({
  userId,
  action,
  taskId,
  meta,
}: {
  userId: string;
  action: string;
  taskId: string;
  meta?: Record<string, any>;
}) => {
  await activityLogModel.create({
    user: userId,
    action,
    entity: "TASK",
    entityId: taskId,
    meta,
  });
};

/* ============================================================
   DEPENDENCY VALIDATION (STILL NEEDED)
============================================================ */
export const validateDependenciesCompleted = async (taskId: string) => {
  const task = await Task.findById(taskId).select("dependencies");

  if (!task?.dependencies?.length) return true;

  const openDeps = await Task.countDocuments({
    _id: { $in: task.dependencies },
    status: { $ne: TaskStatus.COMPLETED },
  });

  return openDeps === 0;
};


/**
 * 🛡️ MISSION METRICS (Registry Edition)
 * Calculates integer days for email triggers and UI display.
 */
export const addMissionMetrics = (task: any) => {
  if (!task) return null;
  const taskObj = task.toObject ? task.toObject() : task;
  
  // FIX: Change taskObj.endDate to taskObj.dueDate
  const end = taskObj.dueDate ? new Date(taskObj.dueDate).getTime() : null;
  const now = Date.now();
  
  if (!end) {
    taskObj.daysRemaining = null;
    taskObj.isOverdue = false;
    return taskObj;
  }

  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  taskObj.daysRemaining = Math.max(0, diffDays);
  taskObj.isOverdue = now > end && taskObj.status !== "COMPLETED";

  return taskObj;
};