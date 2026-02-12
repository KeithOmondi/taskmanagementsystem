import express from "express";
import {
  login,
  verifyOtp,
  resendOtp,
  refreshAccessToken,
  logout,
} from "../controllers/auth.controller";

const router = express.Router();

/* =========================
   AUTH ROUTES
========================= */

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email & password → send OTP
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and complete login
 * @access  Public
 */
router.post("/verify-otp", verifyOtp);

/**
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Resend OTP
 * @access  Public
 */
router.post("/resend-otp", resendOtp);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post("/refresh", refreshAccessToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and clear cookies
 * @access  Public
 */
router.post("/logout", logout);

export default router;
