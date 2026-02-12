import { Types } from "mongoose";
import { IUser } from "../models/user.model";
import { ITask, TaskStatus } from "../models/task.model";

const makeUser = (overrides?: Partial<IUser>): IUser => ({
  _id: new Types.ObjectId(),
  name: "Test User",
  email: "test@example.com",
  pjNumber: "PJ123",
  password: "hashed",
  role: "user",
  isActive: true,
  isEmailVerified: true,
  comparePassword: () => true,
  teams: [],
  ...overrides,
} as IUser);

const makeTask = (overrides?: Partial<ITask>): ITask => ({
  _id: new Types.ObjectId(),
  title: "Test Task",
  assignedTo: [],
  assignedTeams: [],
  priority: "Medium",
  status: TaskStatus.PENDING,
  createdBy: new Types.ObjectId(),
  isRecurring: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
} as ITask);
