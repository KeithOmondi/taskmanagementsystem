export const mailTemplates = {
  /**
   * Sent to Admin when an assignee acknowledges a task
   */
  taskAcknowledgedAdmin: (taskTitle: string, assigneeName: string) => ({
    subject: `[Acknowledged] Mission Update: ${taskTitle}`,
    template: `
      <div style="font-family: sans-serif; color: #1E3A2B; line-height: 1.6;">
        <h2 style="color: #C69214; border-bottom: 2px solid #F3F4F6; padding-bottom: 10px;">Mission Acknowledged</h2>
        <p>This is an automated intelligence update.</p>
        <p><strong>Assignee:</strong> ${assigneeName}</p>
        <p><strong>Objective:</strong> ${taskTitle}</p>
        <p>The operative has confirmed receipt of this briefing and is now actively working on the objective.</p>
        <hr style="border: 0; border-top: 1px solid #F3F4F6; margin: 20px 0;" />
        <small style="color: #9CA3AF;">Frequency: Active Registry</small>
      </div>
    `,
  }),

  /**
   * Sent to User confirming they've acknowledged the task
   */
  taskAcknowledgedUser: (taskTitle: string, name: string) => ({
    subject: `Confirmation: ${taskTitle} Briefing Received`,
    template: `
      <div style="font-family: sans-serif; color: #1E3A2B;">
        <p>Hello ${name},</p>
        <p>You have successfully acknowledged the mission objective: <strong>${taskTitle}</strong>.</p>
        <p>This objective has been moved to your <b>Active</b> frequency. Please ensure all progress is logged via the registry.</p>
        <p>Good luck.</p>
      </div>
    `,
  }),

  /**
   * Sent to Admin when a task is completed
   */
  taskCompletedAdmin: (taskTitle: string, assigneeName: string) => ({
    subject: `[Completed] Mission Accomplished: ${taskTitle}`,
    template: `
      <div style="font-family: sans-serif; color: #1E3A2B;">
        <h2 style="color: #1E3A2B;">Objective Secured</h2>
        <p><strong>${assigneeName}</strong> has marked the following task as <strong>COMPLETED</strong>:</p>
        <div style="background: #F9FAFB; padding: 20px; border-left: 4px solid #1E3A2B;">
          <h3 style="margin-top: 0;">${taskTitle}</h3>
        </div>
        <p>Please review the mission registry for final documentation and logs.</p>
      </div>
    `,
  }),
};