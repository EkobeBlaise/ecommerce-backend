import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createTransporter = () => {
  return nodemailer.createTransport({
    // ✅ SWITCHED BACK TO GMAIL SMTP
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, // Gmail requires strict SSL on Port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Your 16-char Google App Password
    },
    // 🛡️ Force IPv4 to bypass Render's IPv6 ENETUNREACH block
    family: 4,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const sendEmail = async (to, subject, html, template, metadata = {}) => {
  try {
    // Save to database first (pending status)
    const emailRecord = await prisma.email.create({
      data: {
        template,
        to,
        subject,
        html,
        status: 'pending',
        metadata: JSON.stringify(metadata),
      },
    });

    // Send via SMTP
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'support@luxivotrend.com',
      to,
      subject,
      html,
    });

    // Update status to sent
    await prisma.email.update({
      where: { id: emailRecord.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    return { success: true, emailId: emailRecord.id };
  } catch (error) {
    // Bulletproof error handling
    try {
      await prisma.email.updateMany({
        where: { subject, to, status: 'pending' },
        data: {
          status: 'failed',
          error: error.message || 'Unknown error',
        },
      });
    } catch (dbError) {
      console.error('Failed to update email status to failed:', dbError);
    }
    
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// EMAIL TEMPLATES (Kept exactly as you had them)
// ============================================================

export const getTemplate = (template, data) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://luxivotrend.com';

  const templates = {
    order_confirmation: {
      subject: `Order Confirmation - #${data.orderId || 'N/A'}`,
      html: (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
              <h1 style="color: #ec4899; margin: 0;">🎉 Order Confirmed!</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Thank you for your order</p>
            </div>
            <div style="padding: 20px 0;">
              <p style="color: #374151;"><strong>Order ID:</strong> #${data.orderId || 'N/A'}</p>
              <p style="color: #374151;"><strong>Date:</strong> ${new Date(data.date).toLocaleString()}</p>
              <p style="color: #374151;"><strong>Total:</strong> $${(data.total || 0).toFixed(2)}</p>
              <p style="color: #374151;"><strong>Payment Method:</strong> ${data.paymentMethod || 'Not specified'}</p>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="color: #374151; margin: 0 0 10px;">Order Items</h3>
              ${(data.items || []).map((item) => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #374151;">${item.name} x${item.quantity || 1}</span>
                  <span style="color: #374151; font-weight: bold;">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${baseUrl}/order-confirmation/${data.orderId}" style="background: #ec4899; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">View Order</a>
            </div>
            <p style="color: #6b7280; text-align: center; font-size: 14px; margin-top: 20px;">
              Questions? Contact us at <a href="mailto:${process.env.SMTP_FROM || 'support@luxivotrend.com'}" style="color: #ec4899;">${process.env.SMTP_FROM || 'support@luxivotrend.com'}</a>
            </p>
          </div>
        </div>
      `,
    },
    shipping_update: {
      subject: `Shipping Update - Order #${data.orderId || 'N/A'}`,
      html: (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
              <h1 style="color: #8b5cf6; margin: 0;">🚚 Order Shipped!</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Your order is on its way</p>
            </div>
            <div style="padding: 20px 0;">
              <p style="color: #374151;"><strong>Order ID:</strong> #${data.orderId || 'N/A'}</p>
              <p style="color: #374151;"><strong>Status:</strong> ${data.status || 'Shipped'}</p>
              ${data.trackingNumber ? `<p style="color: #374151;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
              <p style="color: #374151;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery || '5-7 business days'}</p>
            </div>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${baseUrl}/track-order?orderId=${data.orderId}" style="background: #8b5cf6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">Track Order</a>
            </div>
            <p style="color: #6b7280; text-align: center; font-size: 14px; margin-top: 20px;">
              Questions? Contact us at <a href="mailto:${process.env.SMTP_FROM || 'support@luxivotrend.com'}" style="color: #8b5cf6;">${process.env.SMTP_FROM || 'support@luxivotrend.com'}</a>
            </p>
          </div>
        </div>
      `,
    },
    password_reset: {
      subject: 'Password Reset Request',
      html: (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
              <h1 style="color: #3b82f6; margin: 0;">🔐 Password Reset</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Reset your password securely</p>
            </div>
            <div style="padding: 20px 0;">
              <p style="color: #374151;">Hello ${data.name || 'User'},</p>
              <p style="color: #374151;">We received a request to reset your password. Click the button below to create a new password:</p>
            </div>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${data.resetLink}" style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    },
    welcome: {
      subject: 'Welcome to Luxe Wardrobe!',
      html: (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
              <h1 style="color: #ec4899; margin: 0;">👋 Welcome to Luxe Wardrobe</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">We're excited to have you</p>
            </div>
            <div style="padding: 20px 0;">
              <p style="color: #374151;">Hello ${data.name || 'Shopper'},</p>
              <p style="color: #374151;">Thank you for joining Luxe Wardrobe! You now have access to:</p>
              <ul style="color: #374151; padding-left: 20px;">
                <li>🛍️ Exclusive deals and offers</li>
                <li>📦 Order tracking</li>
                <li>❤️ Save your favorite items</li>
                <li>⭐ Earn loyalty points</li>
              </ul>
            </div>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${baseUrl}/products" style="background: #ec4899; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">Start Shopping</a>
            </div>
            <p style="color: #6b7280; text-align: center; font-size: 14px; margin-top: 20px;">
              Questions? Contact us at <a href="mailto:${process.env.SMTP_FROM || 'support@luxivotrend.com'}" style="color: #ec4899;">${process.env.SMTP_FROM || 'support@luxivotrend.com'}</a>
            </p>
          </div>
        </div>
      `,
    },
    abandoned_cart: {
      subject: "Don't Forget Your Items!",
      html: (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
              <h1 style="color: #f59e0b; margin: 0;">🛒 Items Waiting for You!</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Complete your purchase before they're gone</p>
            </div>
            <div style="padding: 20px 0;">
              <p style="color: #374151;">Hello there,</p>
              <p style="color: #374151;">You left some items in your cart. Don't miss out on these great finds!</p>
              ${(data.items || []).map((item) => `
                <div style="display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">` : ''}
                  <div style="flex: 1;">
                    <p style="color: #374151; margin: 0;">${item.name}</p>
                    <p style="color: #6b7280; margin: 0; font-size: 14px;">$${(item.price || 0).toFixed(2)} x ${item.quantity || 1}</p>
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${baseUrl}/cart" style="background: #f59e0b; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">Complete Purchase</a>
            </div>
            <p style="color: #6b7280; text-align: center; font-size: 14px; margin-top: 20px;">
              Items are in high demand - don't wait!
            </p>
          </div>
        </div>
      `,
    },
    email_verification: {
      subject: 'Verify Your Email Address',
      html: (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
              <h1 style="color: #ec4899; margin: 0;">📧 Verify Your Email</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Please confirm your email address</p>
            </div>
            <div style="padding: 20px 0;">
              <p style="color: #374151;">Hello ${data.name || 'User'},</p>
              <p style="color: #374151;">Thank you for signing up! Please click the button below to verify your email address:</p>
            </div>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${data.verifyLink}" style="background: #ec4899; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      `,
    },
  };

  return templates[template] || null;
};