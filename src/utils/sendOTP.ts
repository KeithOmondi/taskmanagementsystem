import { otpEmailTemplate } from "./emailTemplate";
import sendMail from "./sendMail";

const sendOTP = async (email: string, otp: string): Promise<void> => {
  await sendMail({
    email,
    subject: "Your Verification Code",
    template: otpEmailTemplate(otp),
  });
};

export default sendOTP;
