import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail, getTemplate } from '../utils/email.js';

const prisma = new PrismaClient();

// Generate verification token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// ===== SEND verification email =====
export const sendVerification = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    await prisma.emailVerificationToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt,
      },
    });

    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    const template = getTemplate('email_verification', { name: name || user.firstName || 'User', verifyLink });
    
    await sendEmail(email, template.subject, template.html(template.data || {}), 'email_verification', { name });

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.',
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification email' });
  }
};

// ===== VERIFY email =====
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const tokenData = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    if (tokenData.verified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification link has expired' });
    }

    await prisma.emailVerificationToken.update({
      where: { id: tokenData.id },
      data: { verified: true },
    });

    await prisma.user.update({
      where: { email: tokenData.email },
      data: { isVerified: true },
    });

    res.json({
      success: true,
      message: 'Email verified successfully!',
      email: tokenData.email,
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify email' });
  }
};

// ===== RESEND verification email =====
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    await prisma.emailVerificationToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt,
      },
    });

    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    const template = getTemplate('email_verification', { name: user.firstName || 'User', verifyLink });
    
    await sendEmail(email, template.subject, template.html(template.data || {}), 'email_verification', { name: user.firstName });

    res.json({
      success: true,
      message: 'Verification email resent! Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend verification email' });
  }
};

// ===== CHECK verification status =====
export const checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { isVerified: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, verified: user.isVerified });
  } catch (error) {
    console.error('Check verification status error:', error);
    res.status(500).json({ success: false, message: 'Failed to check verification status' });
  }
};

// ===== CLEAN expired tokens =====
export const cleanExpiredTokens = async (req, res) => {
  try {
    const result = await prisma.emailVerificationToken.deleteMany({
      where: {
        OR: [
          { verified: true },
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