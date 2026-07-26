import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ===== GET all reviews (with optional filters) =====
export const getReviews = async (req, res) => {
  try {
    const { status, rating, productId, limit = 50 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (rating) where.rating = parseInt(rating);
    if (productId) where.productId = productId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { name: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    const formatted = reviews.map(r => ({
      id: r.id,
      productId: r.productId,
      productName: r.product?.name || 'Unknown Product',
      productImage: r.product?.images ? JSON.parse(r.product.images)[0] : '',
      userId: r.userId,
      userName: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() || 'Anonymous',
      userEmail: r.user?.email || '',
      rating: r.rating,
      title: r.title || '',
      comment: r.comment || '',
      status: r.status,
      images: [],
      verifiedPurchase: false,
      helpful: 0,
      helpfulUsers: [],
      replies: [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET review by ID =====
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { name: true, images: true } },
      },
    });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    const formatted = {
      id: review.id,
      productId: review.productId,
      productName: review.product?.name || 'Unknown Product',
      productImage: review.product?.images ? JSON.parse(review.product.images)[0] : '',
      userId: review.userId,
      userName: `${review.user?.firstName || ''} ${review.user?.lastName || ''}`.trim() || 'Anonymous',
      userEmail: review.user?.email || '',
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      status: review.status,
      images: [],
      verifiedPurchase: false,
      helpful: 0,
      helpfulUsers: [],
      replies: [],
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== ✅ CREATE a review =====
export const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: Math.min(Math.max(Math.round(rating), 1), 5),
        title: title.trim(),
        comment: comment.trim(),
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    const formatted = {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      userName: `${review.user?.firstName || ''} ${review.user?.lastName || ''}`.trim() || 'Anonymous',
      userEmail: review.user?.email || '',
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };

    res.status(201).json({
      success: true,
      data: formatted,
      message: 'Review submitted successfully. Awaiting approval.'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
};

// ===== ✅ UPDATE a review =====
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    const existingReview = await prisma.review.findUnique({
      where: { id }
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (existingReview.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this review'
      });
    }

    const updateData = {};
    if (rating) updateData.rating = Math.min(Math.max(Math.round(rating), 1), 5);
    if (title) updateData.title = title.trim();
    if (comment) updateData.comment = comment.trim();
    updateData.status = 'pending';

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    const formatted = {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      userName: `${review.user?.firstName || ''} ${review.user?.lastName || ''}`.trim() || 'Anonymous',
      userEmail: review.user?.email || '',
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };

    res.json({
      success: true,
      data: formatted,
      message: 'Review updated successfully. Awaiting re-approval.'
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// ===== UPDATE review status (admin only) =====
export const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const review = await prisma.review.update({
      where: { id },
      data: { status },
    });
    
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== ✅ Moderate review (admin only) =====
export const moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "approved" or "rejected"'
      });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          }
        }
      }
    });

    const formatted = {
      id: review.id,
      productId: review.productId,
      productName: review.product?.name || 'Unknown Product',
      productImage: review.product?.images ? JSON.parse(review.product.images)[0] : '',
      userId: review.userId,
      userName: `${review.user?.firstName || ''} ${review.user?.lastName || ''}`.trim() || 'Anonymous',
      userEmail: review.user?.email || '',
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };

    res.json({
      success: true,
      data: formatted,
      message: `Review ${status} successfully`
    });
  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate review',
      error: error.message
    });
  }
};

// ===== DELETE review =====
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const existingReview = await prisma.review.findUnique({
      where: { id }
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (existingReview.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this review'
      });
    }

    await prisma.review.delete({ where: { id } });
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET global stats =====
export const getReviewStats = async (req, res) => {
  try {
    const total = await prisma.review.count();
    const pending = await prisma.review.count({ where: { status: 'pending' } });
    const approved = await prisma.review.count({ where: { status: 'approved' } });
    const rejected = await prisma.review.count({ where: { status: 'rejected' } });
    
    const approvedReviews = await prisma.review.findMany({
      where: { status: 'approved' },
      select: { rating: true },
    });
    let avgRating = 0;
    if (approvedReviews.length > 0) {
      const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = sum / approvedReviews.length;
    }

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        avgRating,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET reviews for a product =====
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { productId, status: 'approved' },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const formatted = reviews.map(r => ({
      id: r.id,
      userId: r.userId,
      userName: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() || 'Anonymous',
      rating: r.rating,
      title: r.title || '',
      comment: r.comment || '',
      createdAt: r.createdAt,
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};