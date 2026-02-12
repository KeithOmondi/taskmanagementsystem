import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().default("8000"),

  // Database
  MONGO_URI: z.string().url(),
  DB_NAME: z.string().min(1, "DB_NAME is required").optional(),

  // JWT Configuration
  JWT_ACCESS_SECRET: z.string().min(1, "Access secret is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "Refresh secret is required"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),

  // Security
  FRONTEND_URL: z.string().url().default(""),

  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "Cloudinary cloud name is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "Cloudinary API key is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "Cloudinary API secret is required"),

  // SMTP (Brevo Configuration)
  // Inside your env.ts schema
  // Brevo API Configuration
  BREVO_API_KEY: z.string().min(1, "Brevo API Key is required"),
  MAIL_FROM_NAME: z.string().default("Mission Control"),
  MAIL_FROM_EMAIL: z.string().email("Invalid sender email"),
  MAIL_CC_EMAIL: z.string().email(""),
});

// Parse and validate
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(_env.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env = _env.data;