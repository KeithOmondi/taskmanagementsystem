import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import sendToken from "../utils/sendToken";
import { env } from "../config/env";
import sendMail from "../utils/sendMail"; // Import the actual mail utility
import { generateOTP, hashOtp } from "../utils/generateOTP";
import { asyncHandler } from "../middleware/errorHandler";
import { otpEmailTemplate } from "../utils/emailTemplate";

/**
 * @desc    Login and Send OTP
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { pjNumber } = req.body;
  
  if (!pjNumber) {
    res.status(400);
    throw new Error("PJ number is required");
  }

  const user = await User.findOne({ pjNumber }).select("+password +email");
  
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

  // 🟢 Use the final sendMail version with CC disabled
  await sendMail({
    email: user.email,
    subject: "Security Briefing: Verification Code",
    template: otpEmailTemplate(otp),
    shouldCC: false, 
  });

  res.status(200).json({
    success: true,
    message: `Verification code sent to ${user.email}`,
  });
});

/**
 * @desc    Resend OTP
 */
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { pjNumber } = req.body;
  
  const user = await User.findOne({ pjNumber }).select("+password +email");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { otp, hashedOtp, expiresAt } = generateOTP();
  user.resetPasswordToken = hashedOtp;
  user.resetPasswordExpire = expiresAt;
  await user.save({ validateBeforeSave: false });

  // 🟢 CC disabled here too
  await sendMail({
    email: user.email,
    subject: "Resent: Verification Code",
    template: otpEmailTemplate(otp),
    shouldCC: false,
  });

  res.status(200).json({
    success: true,
    message: `A new verification code has been sent to ${user.email}`,
  });
});

/**
 * @desc    Verify OTP and Issue Token
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

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return sendToken(res, { _id: user._id, role: user.role }, 200, "Authentication successful");
});

/**
 * @desc    Refresh Access Token
 */
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken; // Usually cleaner to use only cookies for refresh
  
  if (!token) {
    res.status(401);
    throw new Error("No refresh token found");
  }

  try {
    // 🟢 Try/Catch prevents 500 crashes if token is malformed
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string; role: string };
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error("User session invalid");
    }

    return sendToken(res, { _id: user._id, role: user.role }, 200, "Token refreshed");
  } catch (err) {
    res.status(401);
    throw new Error("Session expired or invalid");
  }
});

/**
 * @desc    Logout User
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  const isProduction = env.NODE_ENV === "production";
  
  // 🟢 Options must match sendToken exactly to successfully clear cookies in prod
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    expires: new Date(0),
  };

  res
    .cookie("accessToken", "", cookieOptions)
    .cookie("refreshToken", "", cookieOptions)
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
});