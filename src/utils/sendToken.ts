import { Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

interface TokenPayload {
  id: string;
  role: string;
}

/* =====================================
   Generate Tokens
===================================== */
const generateAccessToken = (payload: TokenPayload) => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

const generateRefreshToken = (payload: TokenPayload) => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

/* =====================================
   Send Tokens via HTTP-Only Cookies
===================================== */
const sendToken = (
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

  const isProduction = env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
  };

  res
    .status(statusCode)
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 mins
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json({
      success: true,
      message,
      user: payload,
    });
};

export default sendToken;
