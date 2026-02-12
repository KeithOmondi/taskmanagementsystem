import { UserRole } from "../models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name?: string; // Add this
        email?: string; // Add this
        role: string;
      };
    }
  }
}

export {};