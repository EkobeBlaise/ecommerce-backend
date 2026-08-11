import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ===== GET user's wishlist =====
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: { variants: true, brand: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== ADD product to wishlist =====
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Check if already in wishlist to prevent duplicates
    const existing = await prisma.wishlist.findFirst({
      where: { userId, productId }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId,
        productId
      },
      include: { product: true }
    });

    res.status(201).json({ success: true, data: wishlistItem });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== REMOVE product from wishlist =====
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    await prisma.wishlist.deleteMany({
      where: { userId, productId }
    });

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};