import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmail, getTemplate } from '../utils/email.js';

const prisma = new PrismaClient();

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// ===== Request password reset =====
export const requestReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, a reset link has been sent.',
      });
    }

    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt,
        used: false,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const template = getTemplate('password_reset', { name: user.firstName || 'User', resetLink });
    
    await sendEmail(email, template.subject, template.html(template.data || {}), 'password_reset', { name: user.firstName });

    res.json({
      success: true,
      message: 'If an account exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Request reset error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

// ===== Validate reset token =====
export const validateToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const tokenData = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return res.json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (tokenData.used) {
      return res.json({ success: false, message: 'This reset link has already been used' });
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      return res.json({ success: false, message: 'This reset link has expired' });
    }

    res.json({ success: true, data: { email: tokenData.email } });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate token' });
  }
};

// ===== Reset password =====
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const tokenData = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (tokenData.used) {
      return res.status(400).json({ success: false, message: 'This reset link has already been used' });
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'This reset link has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email: tokenData.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.update({
      where: { id: tokenData.id },
      data: { used: true },
    });

    await prisma.passwordResetToken.deleteMany({
      where: { email: tokenData.email },
    });

    res.json({ success: true, message: 'Password reset successfully!' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// ===== Clean expired tokens =====
export const cleanExpiredTokens = async (req, res) => {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { used: true },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });
    res.json({ success: true, deletedCount: result.count });
  } catch (error) {
    console.error('Clean tokens error:', error);
    res.status(500).json({ success: false, message: 'Failed to clean tokens' });
  }
};