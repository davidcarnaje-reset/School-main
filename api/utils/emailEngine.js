import nodemailer from 'nodemailer';

// Initialize the Nodemailer SMTP transport engine
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true if port is 465, false for 587/25
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Ensure we fail fast on connection errors
  connectionTimeout: 10000, 
});

/**
 * Sends a clean, premium HTML welcome email to the newly enrolled student.
 * 
 * @param {string} toEmail - The recipient student email address
 * @param {string} studentName - The student's full name
 * @param {string} studentId - The newly generated Student ID
 * @returns {Promise<object>} The nodemailer send receipt status
 */
export const sendStudentWelcomeEmail = async (toEmail, studentName, studentId) => {
  const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SMS Cloud Portal</title>
    <style>
      body {
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8fafc;
        color: #334155;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper {
        width: 100%;
        background-color: #f8fafc;
        padding: 40px 20px;
        box-sizing: border-box;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
        border: 1px solid #f1f5f9;
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        padding: 40px 30px;
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.025em;
        text-transform: uppercase;
      }
      .header p {
        margin: 8px 0 0;
        font-size: 14px;
        opacity: 0.9;
        font-weight: 500;
      }
      .content {
        padding: 40px 30px;
        line-height: 1.6;
      }
      .content h2 {
        font-size: 20px;
        color: #0f172a;
        margin-top: 0;
        font-weight: 700;
      }
      .id-card {
        background-color: #f1f5f9;
        border-radius: 12px;
        padding: 24px;
        margin: 24px 0;
        border-left: 4px solid #2563eb;
        text-align: center;
      }
      .id-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #64748b;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .id-value {
        font-size: 28px;
        font-weight: 800;
        color: #2563eb;
        letter-spacing: 0.05em;
        font-family: monospace;
        margin: 0;
      }
      .button-container {
        text-align: center;
        margin-top: 32px;
      }
      .btn {
        background-color: #2563eb;
        color: #ffffff !important;
        text-decoration: none;
        padding: 12px 30px;
        border-radius: 8px;
        font-weight: 700;
        display: inline-block;
        transition: background-color 0.2s;
      }
      .footer {
        background-color: #f8fafc;
        padding: 24px 30px;
        text-align: center;
        font-size: 12px;
        color: #94a3b8;
        border-top: 1px solid #f1f5f9;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <h1>Welcome to School</h1>
          <p>Enrollment Process Successful</p>
        </div>
        <div class="content">
          <h2>Congratulations, ${studentName}!</h2>
          <p>Your enrollment has been successfully processed and verified by the school registrar. We are thrilled to welcome you to the academic year!</p>
          
          <div class="id-card">
            <div class="id-label">Assigned Student ID</div>
            <div class="id-value">${studentId}</div>
          </div>

          <p>You can now use this Student ID to access the Student Portal, check your class schedule, grade evaluations, and financial billing statements.</p>
          
          <div class="button-container">
            <a href="http://localhost:5173" class="btn" target="_blank">Access Student Portal</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 SMS Cloud Portal. All rights reserved.</p>
          <p>This is an automated enrollment notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  const mailOptions = {
    from: `"SMS Registrar" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `🎓 Enrollment Successful! Your Student ID: ${studentId}`,
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Welcome email successfully sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${toEmail}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Sends a clean, premium HTML invitation email to the newly created staff member.
 * 
 * @param {string} toEmail - The recipient staff email address
 * @param {string} staffName - The staff's full name
 * @param {string} role - The staff's role (e.g. registrar, cashier, teacher)
 * @param {string} token - The unique verification token
 * @returns {Promise<object>} The nodemailer send receipt status
 */
export const sendStaffInvitationEmail = async (toEmail, staffName, role, token) => {
  const setupLink = `http://localhost:5173/setup-password?token=${token}&email=${encodeURIComponent(toEmail)}`;
  
  const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Staff Account</title>
    <style>
      body {
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8fafc;
        color: #334155;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper {
        width: 100%;
        background-color: #f8fafc;
        padding: 40px 20px;
        box-sizing: border-box;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
        border: 1px solid #f1f5f9;
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #1e293b, #0f172a);
        padding: 40px 30px;
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.025em;
        text-transform: uppercase;
      }
      .header p {
        margin: 8px 0 0;
        font-size: 14px;
        opacity: 0.9;
        font-weight: 500;
      }
      .content {
        padding: 40px 30px;
        line-height: 1.6;
      }
      .content h2 {
        font-size: 20px;
        color: #0f172a;
        margin-top: 0;
        font-weight: 700;
      }
      .button-container {
        text-align: center;
        margin-top: 32px;
        margin-bottom: 32px;
      }
      .btn {
        background-color: #2563eb;
        color: #ffffff !important;
        text-decoration: none;
        padding: 12px 30px;
        border-radius: 8px;
        font-weight: 700;
        display: inline-block;
        transition: background-color 0.2s;
      }
      .footer {
        background-color: #f8fafc;
        padding: 24px 30px;
        text-align: center;
        font-size: 12px;
        color: #94a3b8;
        border-top: 1px solid #f1f5f9;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <h1>Welcome to the Staff Portal</h1>
          <p>Account Invitation</p>
        </div>
        <div class="content">
          <h2>Hi, ${staffName}!</h2>
          <p>An administrator has created a staff account for you as a <strong>${role}</strong>.</p>
          <p>Please click the button below to verify your email address and set up your personal login password:</p>
          
          <div class="button-container">
            <a href="${setupLink}" class="btn" target="_blank">Verify Account & Set Password</a>
          </div>
          
          <p>If you did not request this account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 SMS Cloud Portal. All rights reserved.</p>
          <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  const mailOptions = {
    from: `"System Administrator" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `🔑 Verify Your Staff Account - SMS Portal`,
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Staff invitation email successfully sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send staff invitation email to ${toEmail}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export default transporter;
