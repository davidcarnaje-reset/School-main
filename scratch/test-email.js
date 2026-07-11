import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'undefined');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: parseInt(process.env.SMTP_PORT, 10) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
});

const mailOptions = {
  from: `"${process.env.SMTP_USER}" <${process.env.SMTP_USER}>`,
  to: process.env.SMTP_USER, // Send to self to test
  subject: 'Test Email sending from SMS Main Backend',
  text: 'Hello! This is a test email sent from the SMS main backend server to verify SMTP transmission.',
  html: '<b>Hello!</b> This is a test email sent from the SMS main backend server to verify SMTP transmission.'
};

console.log('Attempting to send mail...');
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('SMTP Send Error:', error);
  } else {
    console.log('SMTP Send Success:', info);
  }
  process.exit(0);
});
