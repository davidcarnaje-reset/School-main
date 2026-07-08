import nodemailer from 'nodemailer';
import pool from '../config/db.js';

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
 * Helper to retrieve school branding dynamically from the database.
 */
const getEmailBranding = async () => {
  try {
    const [rows] = await pool.query("SELECT school_name, theme_color, school_logo FROM school_settings WHERE id = 1");
    if (rows.length > 0) {
      return {
        schoolName: rows[0].school_name || 'SMS Cloud Portal',
        themeColor: rows[0].theme_color || '#2563eb',
        schoolLogo: rows[0].school_logo || ''
      };
    }
  } catch (error) {
    console.error("Error fetching email branding settings:", error);
  }
  return {
    schoolName: 'SMS Cloud Portal',
    themeColor: '#2563eb',
    schoolLogo: ''
  };
};

/**
 * Standardizes a highly premium, modern, responsive HTML container for school emails.
 */
const generateEmailHtml = (schoolName, themeColor, schoolLogo, headerTitle, title, contentHtml) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
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
        border-radius: 24px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        border: 1px solid #f1f5f9;
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, ${themeColor}, #0f172a);
        padding: 40px 30px;
        text-align: center;
        color: #ffffff;
      }
      .logo-img {
        max-height: 60px;
        margin-bottom: 16px;
        border-radius: 8px;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.025em;
        text-transform: uppercase;
      }
      .header p {
        margin: 6px 0 0;
        font-size: 12px;
        opacity: 0.9;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .content {
        padding: 40px 30px;
        line-height: 1.7;
      }
      .content h2 {
        font-size: 20px;
        color: #0f172a;
        margin-top: 0;
        font-weight: 700;
      }
      .button-container {
        text-align: center;
        margin: 32px 0;
      }
      .btn {
        background-color: ${themeColor};
        color: #ffffff !important;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 13px;
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        box-shadow: 0 4px 10px rgba(0,0,0,0.06);
      }
      .footer {
        background-color: #f8fafc;
        padding: 24px 30px;
        text-align: center;
        font-size: 12px;
        color: #94a3b8;
        border-top: 1px solid #f1f5f9;
      }
      .footer p {
        margin: 4px 0;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" class="logo-img" />` : ''}
          <h1>${schoolName}</h1>
          <p>${headerTitle}</p>
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          <p>© 2026 ${schoolName}. All rights reserved.</p>
          <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Sends a clean, premium HTML welcome email to the newly enrolled student.
 */
export const sendStudentWelcomeEmail = async (toEmail, studentName, studentId) => {
  const branding = await getEmailBranding();

  const contentHtml = `
    <h2>Congratulations, ${studentName}!</h2>
    <p>Your enrollment has been successfully processed and verified by the school registrar. We are thrilled to welcome you to the academic year!</p>
    
    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid ${branding.themeColor}; text-align: center;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 700; margin-bottom: 4px;">Assigned Student ID</div>
      <div style="font-size: 28px; font-weight: 800; color: ${branding.themeColor}; letter-spacing: 0.05em; font-family: monospace; margin: 0;">${studentId}</div>
    </div>

    <p>You can now use this Student ID to access the Student Portal, check your class schedule, grade evaluations, and financial billing statements.</p>
    
    <div class="button-container">
      <a href="http://localhost:5173" class="btn" target="_blank">Access Student Portal</a>
    </div>
  `;

  const htmlTemplate = generateEmailHtml(
    branding.schoolName, 
    branding.themeColor, 
    branding.schoolLogo, 
    "Enrollment Success", 
    "Welcome to School", 
    contentHtml
  );

  const mailOptions = {
    from: `"${branding.schoolName} Registrar" <${process.env.SMTP_USER}>`,
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
 */
export const sendStaffInvitationEmail = async (toEmail, staffName, role, token, username) => {
  const setupLink = `http://localhost:5173/setup-password?token=${token}&email=${encodeURIComponent(toEmail)}`;
  const branding = await getEmailBranding();

  const contentHtml = `
    <h2>Hi, ${staffName}!</h2>
    <p>An administrator has created a staff account for you as a <strong>${role}</strong>.</p>
    
    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid ${branding.themeColor}; text-align: left;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 700; margin-bottom: 8px;">Your Account Credentials</div>
      <div style="font-size: 14px; margin-bottom: 6px; color: #334155;"><strong style="color: #0f172a;">Username:</strong> ${username || 'N/A'}</div>
      <div style="font-size: 14px; color: #334155;"><strong style="color: #0f172a;">Email:</strong> ${toEmail}</div>
    </div>

    <p>Please click the button below to verify your email address and set up your personal login password:</p>
    
    <div class="button-container">
      <a href="${setupLink}" class="btn" target="_blank">Verify Account & Set Password</a>
    </div>
    
    <p>If you did not request this account, please ignore this email.</p>
  `;

  const htmlTemplate = generateEmailHtml(
    branding.schoolName, 
    branding.themeColor, 
    branding.schoolLogo, 
    "Account Invitation", 
    "Welcome to the Staff Portal", 
    contentHtml
  );

  const mailOptions = {
    from: `"${branding.schoolName} IT Department" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `🔑 Verify Your Staff Account - ${branding.schoolName}`,
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

/**
 * Sends a premium password reset request email to the user.
 */
export const sendPasswordResetEmail = async (toEmail, firstName, resetLink) => {
  const branding = await getEmailBranding();

  const contentHtml = `
    <h2>Hello, ${firstName}!</h2>
    <p>We received a request to reset the password for your account. If you made this request, please click the button below to set up a new password:</p>
    
    <div class="button-container">
      <a href="${resetLink}" class="btn" target="_blank">Reset My Password</a>
    </div>
    
    <p style="color: #ef4444; font-size: 13px; font-weight: bold;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
  `;

  const htmlTemplate = generateEmailHtml(
    branding.schoolName, 
    branding.themeColor, 
    branding.schoolLogo, 
    "Password Reset Request", 
    "Reset Your Password", 
    contentHtml
  );

  const mailOptions = {
    from: `"${branding.schoolName} IT Support" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `🔒 Password Reset Request - ${branding.schoolName}`,
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Password reset email successfully sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${toEmail}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export default transporter;
