import * as brevo from "@getbrevo/brevo";
import { env } from "../config/env";

interface MailOptions {
  email: string;
  subject: string;
  template: string;
}

const sendMail = async (options: MailOptions): Promise<void> => {
  const apiInstance = new brevo.TransactionalEmailsApi();

  // Configure API Key authentication
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey, 
    env.BREVO_API_KEY
  );

  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.template;
  sendSmtpEmail.sender = { 
    name: env.MAIL_FROM_NAME, 
    email: env.MAIL_FROM_EMAIL 
  };
  sendSmtpEmail.to = [{ email: options.email }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ API Email sent successfully. Message ID:", data.body.messageId);
  } catch (error) {
    console.error("❌ Brevo API Error:", error);
    throw new Error("Email service communication failed.");
  }
};

export default sendMail;