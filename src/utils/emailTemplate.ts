export const otpEmailTemplate = (otp: string): string => {
  // Replace with your actual logo URL (must be a public HTTPS link)
  const logoUrl =
    "https://res.cloudinary.com/do0yflasl/image/upload/v1770035125/JOB_LOGO_qep9lj.jpg";

  return `
    <div style="background-color: #f9fafb; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <div style="background-color: #355E3B; padding: 30px; text-align: center;">
          <img src="${logoUrl}" alt="Logo" style="height: 50px; margin-bottom: 10px;">
          <h2 style="color: #EFBF04; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">
            Identity Verification
          </h2>
        </div>

        <div style="padding: 40px 30px; text-align: center;">
          <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
            Hello, <br> Use the following One-Time Password (OTP) to securely access your account.
          </p>

          <div style="background-color: #f3f4f6; border: 2px dashed #355E3B; border-radius: 8px; padding: 20px; display: inline-block;">
            <span style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #355E3B; font-family: monospace;">
              ${otp}
            </span>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This code is valid for <strong>5 minutes</strong>. <br>
            For security, do not share this code with anyone.
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            If you did not request this, please contact support immediately.
          </p>
          <p style="color: #355E3B; font-size: 12px; font-weight: bold; margin-top: 5px;">
            © ${new Date().getFullYear()} office of the registrar high court
          </p>
        </div>

      </div>
    </div>
  `;
};
