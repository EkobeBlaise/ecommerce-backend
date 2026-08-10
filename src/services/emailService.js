import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password',
    },
    // 🚀 RENDER IPv6 FIX:
    family: 4, // Forces IPv4 to prevent ENETUNREACH errors
    tls: {
      rejectUnauthorized: false, // Prevents certificate handshake errors on Render
    },
  });
};

export const sendPasswordResetEmail = async (email, name, resetLink) => {
  const transporter = createTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
          <h1 style="color: #3b82f6; margin: 0;">🔐 Password Reset</h1>
          <p style="color: #6b7280; margin: 8px 0 0;">Reset your password securely</p>
        </div>
        <div style="padding: 20px 0;">
          <p style="color: #374151;">Hello ${name},</p>
          <p style="color: #374151;">We received a request to reset your password. Click the button below to create a new password:</p>
        </div>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px; text-align: center;">Questions? Contact us at support@luxivotrend.com</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@luxivotrend.com',
    to: email,
    subject: 'Password Reset Request',
    html,
  });
};