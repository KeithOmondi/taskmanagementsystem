import * as brevo from "@getbrevo/brevo";
import { env } from "../config/env";

interface MailOptions {
  email: string;
  subject: string;
  template: string;
  /** Set to false to prevent the global CC email from being included (e.g., for OTPs) */
  shouldCC?: boolean;
}

const sendMail = async (options: MailOptions): Promise<void> => {
  const apiInstance = new brevo.TransactionalEmailsApi();

  // Configure API Key authentication
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    env.BREVO_API_KEY,
  );

  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.template;
  sendSmtpEmail.sender = {
    name: env.MAIL_FROM_NAME,
    email: env.MAIL_FROM_EMAIL,
  };

  // Primary Recipient
  sendSmtpEmail.to = [{ email: options.email }];

  /* ==========================================================
     CC LOGIC:
     1. Only CC if shouldCC is NOT explicitly false
     2. Only CC if MAIL_CC_EMAIL exists in env
     ========================================================== */
  const ccEmail = env.MAIL_CC_EMAIL;
  if (
    options.shouldCC !== false &&
    typeof ccEmail === "string" &&
    ccEmail.length > 0
  ) {
    sendSmtpEmail.cc = [{ email: ccEmail }];
  }

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email sent successfully to:", options.email);

    // Log CC status for debugging
    if (sendSmtpEmail.cc) {
      console.log("📎 CC dispatched to registry:", ccEmail);
    }
  } catch (error: any) {
    // Enhanced error logging for Render/Production debugging
    const errorDetail = error.response?.body || error.message;
    console.error("❌ Brevo API Error:", errorDetail);
    throw new Error("Email service communication failed.");
  }
};

export default sendMail;
