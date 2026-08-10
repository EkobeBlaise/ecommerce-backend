// src/services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// 1. Create the Transporter using Hostinger's SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, // Port 465 requires strict SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Bypasses strict certificate checks on Render
    },
  });
};

// 2. Internal Email Sender
const sendMail = async (to, subject, html) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'support@luxivotrend.com',
    to,
    subject,
    html,
  });
};

// ============================================================
// HTML GENERATORS (Templates)
// ============================================================

// 3. Password Reset
export const sendPasswordResetEmail = async (email, name, resetLink) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
          <h1 style="color: #3b82f6; margin: 0;">🔐 Password Reset</h1>
        </div>
        <div style="padding: 20px 0;">
          <p style="color: #374151;">Hello ${name},</p>
          <p style="color: #374151;">We received a request to reset your password. Click the button below to create a new one:</p>
        </div>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;
  await sendMail(email, 'Password Reset Request', html);
};

// 4. Email Verification
export const sendEmailVerification = async (email, name, verificationLink) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h1 style="text-align: center; color: #3b82f6;">✅ Verify Your Email</h1>
        <p style="color: #374151; padding: 10px 0;">Hi ${name},</p>
        <p style="color: #374151;">Please click the button below to confirm your email address:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verificationLink}" style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
      </div>
    </div>
  `;
  await sendMail(email, 'Verify Your Email Address', html);
};

// 5. Order Confirmation
export const sendOrderConfirmationEmail = async (email, orderData) => {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">x${item.quantity}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #374151;">✅ Order Confirmation</h2>
        <p>Thank you for your purchase! Order #${orderData.orderId}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: right;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div style="margin-top: 15px; text-align: right;">
          <p><strong>Total: $${orderData.total.toFixed(2)}</strong></p>
        </div>
      </div>
    </div>
  `;
  await sendMail(email, `Order Confirmation #${orderData.orderId}`, html);
};

// 6. Shipping Update
export const sendShippingUpdateEmail = async (email, orderData) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #374151;">🚚 Shipping Update</h2>
        <p>Good news! Your order #${orderData.orderId} has been <strong>${orderData.status}</strong>.</p>
        <p>Tracking Number: <strong>${orderData.trackingNumber}</strong></p>
        <p>Estimated Delivery: ${orderData.estimatedDelivery}</p>
      </div>
    </div>
  `;
  await sendMail(email, `Shipping Update - Order #${orderData.orderId}`, html);
};

// 7. Welcome Email
export const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #374151;">🎉 Welcome to Luxivo Trend!</h2>
        <p>Hi ${name},</p>
        <p>Thanks for joining us! We're excited to have you on board.</p>
        <p>Feel free to explore our latest collections and exclusive deals.</p>
      </div>
    </div>
  `;
  await sendMail(email, 'Welcome to Luxivo Trend', html);
};

// 8. Abandoned Cart
export const sendAbandonedCartEmail = async (email, items) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #374151;">🛒 Don't Forget Your Items!</h2>
        <p>You left these items in your cart. Complete your purchase now!</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead><tr><th style="padding: 8px; text-align: left;">Item</th><th style="padding: 8px; text-align: right;">Price</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/cart" style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">Go to Cart</a>
        </div>
      </div>
    </div>
  `;
  await sendMail(email, 'Complete Your Purchase!', html);
};