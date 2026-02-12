export const otpEmailTemplate = (otp: string): string => {
  return `
    <div style="font-family: sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:10px;">
      <h2 style="color:#333;">Verification Code</h2>
      <p>Use the code below to complete your login. This code is valid for 5 minutes.</p>

      <div style="background:#f4f4f4; padding:20px; text-align:center; font-size:32px; font-weight:bold; letter-spacing:5px; color:#10b981;">
        ${otp}
      </div>

      <p style="margin-top:20px; color:#666; font-size:12px;">
        If you did not request this code, please ignore this email.
      </p>
    </div>
  `;
};
