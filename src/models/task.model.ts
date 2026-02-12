import mongoose, { Document, Model, Schema } from "mongoose";

/* ---------------- ENUMS ---------------- */

export enum TaskPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  URGENT = "Urgent",
}

export enum TaskStatus {
  PENDING = "Pending", // Admin deployed, User hasn't opened
  ACKNOWLEDGED = "Acknowledged", // User opened (Auto-read receipt)
  COMPLETED = "Completed", // User manually finished
  ON_HOLD = "On Hold",
  ARCHIVED = "Archived",
}

export enum RecurrenceFrequency {
  DAILY = "Daily",
  WEEKLY = "Weekly",
  MONTHLY = "Monthly",
  CUSTOM = "Custom",
}

/* ---------------- SUB TYPES ---------------- */

export interface ITaskAttachment {
  _id?: mongoose.Types.ObjectId;
  url: string;
  fileName: string;
  fileType: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

export interface ITimeLog {
  userId: mongoose.Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
}

export interface IRecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
  nextRunAt?: Date;
}

/* ---------------- MAIN INTERFACE ---------------- */

export interface ITask extends Document {
  title: string;
  description?: string;

  /** * The Category/Sector assignment.
   * References the Category model (Summit Headers or Sub-sectors)
   */
  category: mongoose.Types.ObjectId;

  /* Assignment */
  assignedTo: mongoose.Types.ObjectId[];
  assignedTeams?: mongoose.Types.ObjectId[];

  /* Status & Priority */
  priority: TaskPriority;
  status: TaskStatus;

  /* Scheduling */
  dueDate?: Date;
  startDate?: Date;
  acknowledgedAt?: Date;

  /* Subtasks & Dependencies */
  parentTaskId?: mongoose.Types.ObjectId;
  dependencies?: mongoose.Types.ObjectId[];

  /* Recurring */
  isRecurring: boolean;
  recurrence?: IRecurrenceRule;

  /* Kanban / Gantt */
  boardColumn?: string;
  sortOrder?: number;

  /* Files */
  attachments?: ITaskAttachment[];

  /* Time Tracking */
  timeLogs?: ITimeLog[];
  estimatedMinutes?: number;

  /* Audit helpers */
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;

  /* Meta */
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  daysRemaining?: number;
  progressPercent?: number;
  isOverdue?: boolean;
}

/* ---------------- SCHEMA ---------------- */

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category", // Must match the name used in mongoose.model("Category", ...)
      required: true,
    },
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignedTeams: [
      {
        type: Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
    },

    /* Scheduling */
    dueDate: Date,
    startDate: Date,
    acknowledgedAt: Date,

    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    dependencies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      frequency: {
        type: String,
        enum: Object.values(RecurrenceFrequency),
      },
      interval: Number,
      daysOfWeek: [Number],
      endDate: Date,
      nextRunAt: Date,
    },
    boardColumn: String,
    sortOrder: Number,
    attachments: [
      {
        url: String,
        fileName: String,
        fileType: String,
        size: Number,
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    timeLogs: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        startedAt: Date,
        endedAt: Date,
        durationMinutes: Number,
      },
    ],
    estimatedMinutes: Number,
    archivedAt: Date,
    archivedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

/* ---------------- INDEXES ---------------- */

// Added index for Category for the SuperAdmin Registry grouping
taskSchema.index({ category: 1 });
taskSchema.index({ assignedTo: 1, startDate: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ status: 1 });

const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);

export default Task;
