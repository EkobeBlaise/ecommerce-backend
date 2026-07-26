import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and message are required'
      });
    }

    // Save to database
    const contact = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject: subject || '',
        message,
        status: 'unread',
        isRead: false,
      }
    });

    console.log('📧 Contact message saved (ID:', contact.id, ')');
    console.log(`From: ${name} <${email}>`);
    console.log(`Subject: ${subject || 'No subject'}`);
    console.log(`Message: ${message}`);

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: { id: contact.id }
    });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save message. Please try again.'
    });
  }
};