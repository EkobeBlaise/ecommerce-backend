import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Default configuration
const defaultConfig = {
  sections: [
    { id: 'hot_drops', title: '🔥 Hot Drops', subtitle: 'Limited time offers', type: 'hot_drops', icon: '🔥', enabled: true, displayOrder: 1, maxProducts: 4, layout: 'grid' },
    { id: 'new_in', title: '✨ New In', subtitle: 'Latest arrivals', type: 'new_in', icon: '✨', enabled: true, displayOrder: 2, maxProducts: 4, layout: 'grid' },
    { id: 'trending', title: '🌟 Trending Now', subtitle: 'Most popular this week', type: 'trending', icon: '🌟', enabled: true, displayOrder: 3, maxProducts: 4, layout: 'grid', backgroundColor: '#fdf2f8' },
    { id: 'seasonal', title: '☀️ Summer Collection', subtitle: 'Sun-ready styles', type: 'seasonal', icon: '☀️', enabled: true, displayOrder: 4, maxProducts: 4, layout: 'grid' },
    { id: 'bestsellers', title: '🏆 Bestsellers', subtitle: 'Customer favorites', type: 'bestsellers', icon: '🏆', enabled: true, displayOrder: 5, maxProducts: 4, layout: 'grid', backgroundColor: '#f9fafb' },
  ],
  featuredBrands: [],
  featuredCategories: [],
  heroSlides: [],
  stories: [],
  moreBrands: [],
  moreInspiration: [],
};

// ===== GET config =====
export const getConfig = async (req, res) => {
  try {
    let record = await prisma.merchandisingConfig.findUnique({ where: { id: 'single' } });
    if (!record) {
      // Create default if not exists
      record = await prisma.merchandisingConfig.create({
        data: {
          id: 'single',
          data: JSON.stringify(defaultConfig),
        },
      });
    }
    const config = JSON.parse(record.data);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== UPDATE config =====
export const updateConfig = async (req, res) => {
  try {
    const config = req.body;
    const record = await prisma.merchandisingConfig.upsert({
      where: { id: 'single' },
      update: { data: JSON.stringify(config) },
      create: { id: 'single', data: JSON.stringify(config) },
    });
    res.json({ success: true, data: JSON.parse(record.data) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== RESET to default =====
export const resetConfig = async (req, res) => {
  try {
    const record = await prisma.merchandisingConfig.upsert({
      where: { id: 'single' },
      update: { data: JSON.stringify(defaultConfig) },
      create: { id: 'single', data: JSON.stringify(defaultConfig) },
    });
    res.json({ success: true, data: JSON.parse(record.data) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};