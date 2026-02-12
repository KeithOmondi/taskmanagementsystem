import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import sendToken from "../utils/sendToken";
import { env } from "../config/env";
import sendOTP from "../utils/sendOTP";
import { generateOTP, hashOtp } from "../utils/generateOTP";
import { asyncHandler } from "../middleware/errorHandler";

/**
 * @desc    Login and Send OTP
 * @route   POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { pjNumber } = req.body;
  
  if (!pjNumber) {
    res.status(400);
    throw new Error("PJ number is required");
  }

  const user = await User.findOne({ pjNumber }).select("+password +email");
  
  // Checking password/pjNumber and existence
  if (!user || !user.comparePassword(pjNumber)) {
    res.status(401);
    throw new Error("Invalid PJ number");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Account is disabled");
  }

  const { otp, hashedOtp, expiresAt } = generateOTP();
  user.resetPasswordToken = hashedOtp;
  user.resetPasswordExpire = expiresAt;
  await user.save({ validateBeforeSave: false });

  await sendOTP(user.email, otp);

  res.status(200).json({
    success: true,
    message: `Verification code sent to ${user.email}`,
  });
});

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 */
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { pjNumber } = req.body;
  
  if (!pjNumber) {
    res.status(400);
    throw new Error("PJ number is required");
  }

  const user = await User.findOne({ pjNumber }).select("+password +email");
  if (!user || !user.comparePassword(pjNumber)) {
    res.status(404);
    throw new Error("User not found");
  }

  const { otp, hashedOtp, expiresAt } = generateOTP();
  user.resetPasswordToken = hashedOtp;
  user.resetPasswordExpire = expiresAt;
  await user.save({ validateBeforeSave: false });

  await sendOTP(user.email, otp);

  res.status(200).json({
    success: true,
    message: `A new verification code has been sent to ${user.email}`,
  });
});

/**
 * @desc    Verify OTP and Issue Token
 * @route   POST /api/auth/verify-otp
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { otp } = req.body;
  if (!otp) {
    res.status(400);
    throw new Error("OTP is required");
  }

  const incomingHashedOtp = hashOtp(otp);

  const user = await User.findOne({
    resetPasswordToken: incomingHashedOtp,
    resetPasswordExpire: { $gt: new Date() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired verification code");
  }

  // Clear OTP and update lastLogin
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return sendToken(res, { _id: user._id, role: user.role }, 200, "Authentication successful");
});

/**
 * @desc    Refresh Access Token
 * @route   POST /api/auth/refresh
 */
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  
  if (!token) {
    res.status(401);
    throw new Error("Session expired");
  }

  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string; role: string };
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User session invalid");
  }

  return sendToken(res, { _id: user._id, role: user.role }, 200, "Token refreshed");
});

/**
 * @desc    Logout User
 * @route   POST /api/auth/logout
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  const isProduction = env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    expires: new Date(0),
  };

  res
    .cookie("accessToken", "", cookieOptions)
    .cookie("refreshToken", "", cookieOptions)
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
});