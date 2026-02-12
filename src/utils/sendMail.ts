import * as brevo from "@getbrevo/brevo";
import { env } from "../config/env";

interface MailOptions {
  email: string;
  subject: string;
  template: string;
}

const sendMail = async (options: MailOptions): Promise<void> => {
  const apiInstance = new brevo.TransactionalEmailsApi();

  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey, 
    env.BREVO_API_KEY || ""
  );

  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.template;
  sendSmtpEmail.sender = { 
    name: env.MAIL_FROM_NAME, 
    email: env.MAIL_FROM_EMAIL 
  };
  
  sendSmtpEmail.to = [{ email: options.email }];

  // 🟢 Explicitly check that it's a string and not empty
if (typeof env.MAIL_CC_EMAIL === 'string' && env.MAIL_CC_EMAIL.length > 0) {
  sendSmtpEmail.cc = [
    { 
      email: env.MAIL_CC_EMAIL as string // Type assertion helps here
    }
  ];
}

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email sent successfully to:", options.email);
    if (env.MAIL_CC_EMAIL) console.log("📎 CC'd to:", env.MAIL_CC_EMAIL);
  } catch (error: any) {
    console.error("❌ Brevo API Error:", error.response?.body || error.message);
    throw new Error("Email service communication failed.");
  }
};

export default sendMail;