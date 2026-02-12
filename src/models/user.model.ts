import mongoose, { Document, Model, Schema, Types } from "mongoose";
import crypto from "crypto";

export enum UserRole {
  SUPER_ADMIN = "superadmin",
  ADMIN = "admin",
  USER = "user",
}

export interface IUser extends Document {
  name: string;
  email: string;
  pjNumber: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;

  // ✅ ADD THIS
  teams?: Types.ObjectId[];

  comparePassword(candidatePJ: string): boolean;
}


const hashPJ = (pjNumber: string) =>
  crypto.createHash("sha256").update(pjNumber).digest("hex");

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    pjNumber: { type: String, required: true, unique: true, trim: true }, // NEW FIELD
    password: {
      type: String,
      required: [true, "PJ Number is required"],
      select: false,
      trim: true, // Critical to prevent hash mismatches
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: true },
    lastLogin: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true },
);

// Pre-save hook to hash password
userSchema.pre("save", function () {
  if (this.isModified("password")) {
    this.password = hashPJ(this.password);
  }
});

// Compare candidate PJ with hashed password
userSchema.methods.comparePassword = function (candidatePJ: string): boolean {
  return hashPJ(candidatePJ) === this.password;
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;
