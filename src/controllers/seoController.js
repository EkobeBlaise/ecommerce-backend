import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const defaultConfig = {
  siteName: 'Luxe Wardrobe',
  siteDescription: 'Your premier destination for fashion and lifestyle products.',
  siteUrl: 'https://luxewardrobe.com',
  siteImage: 'https://luxewardrobe.com/og-image.jpg',
  twitterHandle: '@luxewardrobe',
  facebookAppId: '',
  keywords: ['fashion', 'clothing', 'shoes', 'accessories'],
  author: 'luxewardrobe Team',
};

export const getConfig = async (req, res) => {
  try {
    let record = await prisma.sEOConfig.findUnique({ where: { id: 'single' } });
    if (!record) {
      record = await prisma.sEOConfig.create({
        data: { id: 'single', data: JSON.stringify(defaultConfig) },
      });
    }
    const config = JSON.parse(record.data);
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('❌ SEO GET error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateConfig = async (req, res) => {
  try {
    const config = req.body;
    const record = await prisma.sEOConfig.upsert({
      where: { id: 'single' },
      update: { data: JSON.stringify(config) },
      create: { id: 'single', data: JSON.stringify(config) },
    });
    res.json({ success: true, data: JSON.parse(record.data) });
  } catch (error) {
    console.error('❌ SEO UPDATE error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};