import { IUser } from "../models/user.model";
import { ITask, TaskStatus } from "../models/task.model";
import { hasObjectId } from "../utils/objectId";

export const TaskPolicy = {
  canView(user: IUser, task: ITask) {
    return (
      user.role === "superadmin" ||
      user.role === "admin" ||
      task.createdBy.equals(user._id) ||
      hasObjectId(task.assignedTo, user._id) ||
      task.assignedTeams?.some((teamId) =>
        hasObjectId(user.teams, teamId),
      )
    );
  },

  canUpdate(user: IUser, task: ITask) {
    return (
      user.role === "admin" ||
      user.role === "superadmin" ||
      task.createdBy.equals(user._id) ||
      hasObjectId(task.assignedTo, user._id)
    );
  },

  canComplete(user: IUser, task: ITask) {
    return (
      task.status !== TaskStatus.COMPLETED &&
      hasObjectId(task.assignedTo, user._id)
    );
  },

  canReassign(user: IUser) {
    return user.role === "admin" || user.role === "superadmin";
  },

  canArchive(user: IUser) {
    return user.role === "superadmin";
  },
};
