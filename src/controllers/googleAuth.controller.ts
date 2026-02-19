import { Request, Response } from "express";
import { google } from "googleapis";
import { env } from "../config/env";
import User from "../models/user.model";

// Initialize OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

// ========================
// Generate Google Auth URL
// ========================
export const getGoogleAuthUrl = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar.readonly"],
      state: userId,
    });

    return res.status(200).json({ url: authUrl });
  } catch (error) {
    console.error("Error generating Google Auth URL:", error);
    return res.status(500).json({ message: "Failed to generate Google auth URL" });
  }
};

// ========================
// Google OAuth Callback
// ========================
export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const userId = req.query.state as string;

  if (!code || !userId) return res.redirect(`${env.FRONTEND_URL}/calendar?sync=error`);

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.log("No refresh token received from Google.");
      return res.redirect(`${env.FRONTEND_URL}/calendar?sync=error`);
    }

    await User.findByIdAndUpdate(userId, { googleRefreshToken: tokens.refresh_token });
    console.log(`Google Calendar linked for user: ${userId}`);

    return res.redirect(`${env.FRONTEND_URL}/calendar?sync=success`);
  } catch (error) {
    console.error("Google Callback Error:", error);
    return res.redirect(`${env.FRONTEND_URL}/calendar?sync=error`);
  }
};

// ========================
// Fetch Google Calendar Events
// ========================
export const getGoogleCalendarEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId) as any;

    // User hasn't linked Google yet
    if (!user?.googleRefreshToken) {
      console.log(`No Google refresh token for user: ${userId}`);
      return res.status(200).json({ events: [], googleConnected: false });
    }

    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: thirtyDaysAgo.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const items = response.data.items || [];
    const events = items
      .map((event) => {
        const dueDate = event.start?.dateTime || event.start?.date;
        return {
          _id: event.id,
          title: event.summary || "Untitled Event",
          description: event.description || "",
          dueDate,
          status: "External",
          priority: "Routine",
          source: "google",
        };
      })
      .filter((event) => event.dueDate);

    return res.status(200).json({ events, googleConnected: true });
  } catch (error: any) {
    console.error("Google Fetch Error:", error);
    return res.status(500).json({ message: "Failed to fetch Google Calendar events", error: error.message });
  }
};
