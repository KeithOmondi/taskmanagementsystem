const LOGO_URL =
  "https://res.cloudinary.com/do0yflasl/image/upload/v1770035125/JOB_LOGO_qep9lj.jpg"; // Replace with your public URL
const GREEN = "#355E3B";
const GOLD = "#EFBF04";
const BG_GRAY = "#f9fafb";

// Helper for a consistent wrapper
const emailWrapper = (content: string) => `
  <div style="background-color: ${BG_GRAY}; padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background-color: ${GREEN}; padding: 20px; text-align: center;">
        <img src="${LOGO_URL}" alt="Logo" style="height: 40px;">
      </div>
      <div style="padding: 30px; color: #374151;">
        ${content}
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 11px; color: #9ca3af; letter-spacing: 1px;">
        OFFICIAL COMMUNICATION // REGISTRY SECURE
      </div>
    </div>
  </div>
`;

export const mailTemplates = {
  /**
   * Sent to Admin when an assignee acknowledges a task
   */
  taskAcknowledgedAdmin: (taskTitle: string, assigneeName: string) => ({
    subject: `[Acknowledged] Mission Update: ${taskTitle}`,
    template: emailWrapper(`
      <h2 style="color: ${GREEN}; margin-top: 0; border-bottom: 2px solid ${GOLD}; padding-bottom: 10px; font-size: 20px;">
        MISSION ACKNOWLEDGED
      </h2>
      <p style="font-size: 15px;">Automated intelligence update received:</p>
      <div style="background: ${BG_GRAY}; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>OPERATIVE:</strong> <span style="color: ${GREEN};">${assigneeName}</span></p>
        <p style="margin: 5px 0;"><strong>OBJECTIVE:</strong> ${taskTitle}</p>
      </div>
      <p>The operative has confirmed receipt of the briefing and has moved to <strong>Active Status</strong>.</p>
    `),
  }),

  /**
   * Sent to User confirming they've acknowledged the task
   */
  taskAcknowledgedUser: (taskTitle: string, name: string) => ({
    subject: `Confirmation: ${taskTitle} Briefing Received`,
    template: emailWrapper(`
      <p>Greetings, <strong>${name}</strong>.</p>
      <p>You have successfully acknowledged the mission objective:</p>
      <div style="border-left: 4px solid ${GOLD}; padding-left: 15px; margin: 20px 0;">
        <h3 style="color: ${GREEN}; margin: 0;">${taskTitle}</h3>
      </div>
      <p>This has been logged in your <strong>Active Frequency</strong>. Ensure all progress and intelligence artifacts are uploaded to the registry.</p>
      <p style="margin-top: 30px; font-weight: bold; color: ${GREEN};">Good luck.</p>
    `),
  }),

  /**
   * Sent to Admin when a task is completed
   */
  taskCompletedAdmin: (taskTitle: string, assigneeName: string) => ({
    subject: `[Completed] Mission Accomplished: ${taskTitle}`,
    template: emailWrapper(`
      <h2 style="color: #065f46; margin-top: 0; text-align: center;">OBJECTIVE SECURED</h2>
      <div style="text-align: center; margin-bottom: 20px;">
         <span style="background: ${GOLD}; color: ${GREEN}; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 12px;">STATUS: COMPLETED</span>
      </div>
      <p><strong>${assigneeName}</strong> has successfully finalized the following task:</p>
      <div style="background: ${GREEN}; color: #ffffff; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0;">
        <h3 style="margin: 0; color: ${GOLD};">${taskTitle}</h3>
      </div>
      <p>Please conduct a final review of the mission registry for documentation and log closure.</p>
    `),
  }),
};
