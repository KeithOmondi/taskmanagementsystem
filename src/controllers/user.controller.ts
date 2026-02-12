import { Request, Response } from "express";
import mongoose from "mongoose";
import User, { UserRole } from "../models/user.model";
import { asyncHandler } from "../middleware/errorHandler";

/**
 * @desc    Get all users with optional role filter
 * @route   GET /api/users
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const role = Array.isArray(req.query.role) ? req.query.role[0] : req.query.role;
  const filter = role ? { role } : {};

  const users = await User.find(filter).select("-password -resetPasswordToken -resetPasswordExpire");

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 */
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user ID");
  }

  const user = await User.findById(id).select("-password -resetPasswordToken -resetPasswordExpire");
  
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({ success: true, user });
});

/**
 * @desc    Create new user
 * @route   POST /api/users
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, pjNumber, role } = req.body;

  if (!name || !email || !pjNumber) {
    res.status(400);
    throw new Error("Name, email, and PJ number are required");
  }

  const existingUser = await User.findOne({ $or: [{ email }, { pjNumber }] });
  if (existingUser) {
    res.status(409); // Conflict
    throw new Error("User with this email or PJ number already exists");
  }

  const newUser = await User.create({
    name,
    email,
    pjNumber,
    password: pjNumber, // hashed in model pre-save hook
    role: role || UserRole.USER,
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      pjNumber: newUser.pjNumber,
      role: newUser.role,
      isActive: newUser.isActive,
    },
  });
});

/**
 * @desc    Update user details
 * @route   PATCH /api/users/:id
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, email, role, isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user ID");
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { name, email, role, isActive },
    { new: true, runValidators: true }
  ).select("-password -resetPasswordToken -resetPasswordExpire");

  if (!updatedUser) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user: updatedUser,
  });
});

/**
 * @desc    Toggle user active/inactive status
 * @route   PATCH /api/users/status/:id
 */
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user ID");
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
    user: { _id: user._id, isActive: user.isActive },
  });
});