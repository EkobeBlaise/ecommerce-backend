import { PrismaClient } from '@prisma/client';
import { sendEmail, getTemplate } from '../utils/email.js';

const prisma = new PrismaClient();

// ============================================================
// CONTROLLER FUNCTIONS
// ============================================================

// ----- GET all sent emails -----
export const getEmails = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const emails = await prisma.email.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });
    const total = await prisma.email.count();
    res.json({
      success: true,
      data: emails,
      pagination: { total, limit: parseInt(limit), offset: parseInt(offset) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----- GET email by ID -----
export const getEmailById = async (req, res) => {
  try {
    const { id } = req.params;
    const email = await prisma.email.findUnique({ where: { id } });
    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }
    res.json({ success: true, data: email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----- POST send email -----
export const sendTestEmail = async (req, res) => {
  try {
    const { template, to, data } = req.body;

    if (!template || !to) {
      return res.status(400).json({
        success: false,
        message: 'Template and recipient are required',
      });
    }

    const templateData = getTemplate(template, data);
    if (!templateData) {
      return res.status(400).json({
        success: false,
        message: `Template "${template}" not found`,
      });
    }

    const subject = templateData.subject;
    const html = templateData.html(data);

    const result = await sendEmail(to, subject, html, template, data);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully',
        emailId: result.emailId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----- POST preview email (generates HTML without sending) -----
export const previewEmail = async (req, res) => {
  try {
    const { template, data } = req.body;

    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Template is required',
      });
    }

    const templateData = getTemplate(template, data);
    if (!templateData) {
      return res.status(400).json({
        success: false,
        message: `Template "${template}" not found`,
      });
    }

    const subject = templateData.subject;
    const html = templateData.html(data);

    res.json({
      success: true,
      data: {
        subject,
        html,
        previewData: data || {},
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----- GET email templates list -----
export const getTemplates = async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'order_confirmation', label: 'Order Confirmation', description: 'Send after order placement' },
      { id: 'shipping_update', label: 'Shipping Update', description: 'Update customers on shipping' },
      { id: 'password_reset', label: 'Password Reset', description: 'Reset user passwords' },
      { id: 'welcome', label: 'Welcome Email', description: 'New user welcome' },
      { id: 'abandoned_cart', label: 'Abandoned Cart', description: 'Recover abandoned carts' },
    ],
  });
};

// ----- POST resend email -----
export const resendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const email = await prisma.email.findUnique({ where: { id } });

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    const result = await sendEmail(
      email.to,
      email.subject,
      email.html || '',
      email.template,
      email.metadata ? JSON.parse(email.metadata) : {}
    );

    if (result.success) {
      res.json({ success: true, message: 'Email resent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to resend email' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----- DELETE email log -----
export const deleteEmailLog = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.email.delete({ where: { id } });
    res.json({ success: true, message: 'Email log deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};