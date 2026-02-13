import { Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { StringValue } from "ms";

interface TokenPayload {
  id: string;
  role: string;
}

const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES as StringValue,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as string, options);
};

const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES as StringValue,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as string, options);
};

export const sendToken = (
  res: Response,
  user: { _id: any; role: string },
  statusCode = 200,
  message = "Authentication successful",
) => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const isProd = env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: isProd ? "none" as const : "lax" as const,
  };

  // 🔹 DEBUG LOGS
  console.log("===== sendToken DEBUG =====");
  console.log("Environment:", env.NODE_ENV);
  console.log("isProd:", isProd);
  console.log("Access Token:", accessToken);
  console.log("Refresh Token:", refreshToken);
  console.log("Cookie Options:", cookieOptions);
  console.log("===========================");

  res
    .status(statusCode)
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      message,
      user: payload,
      accessToken, // optional for SPA
    });
};


export default sendToken;
