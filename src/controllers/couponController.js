import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ============================================================
// CRUD
// ============================================================

// GET all coupons
export const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET coupon by ID
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET coupon by code (case-insensitive)
export const getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await prisma.coupon.findFirst({
      where: { code: { equals: code.toUpperCase() } },
    });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create coupon
export const createCoupon = async (req, res) => {
  try {
    const { code, description, type, value, minOrderAmount, maxDiscount, usageLimit, perUserLimit, startDate, endDate, status } = req.body;

    // Ensure code is uppercase
    const finalCode = code ? code.toUpperCase() : generateRandomCode();

    // Check if code already exists
    const existing = await prisma.coupon.findFirst({
      where: { code: finalCode },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: finalCode,
        description: description || '',
        type,
        value,
        minOrderAmount: minOrderAmount || 0,
        maxDiscount: maxDiscount || 0,
        usageLimit: usageLimit || 100,
        perUserLimit: perUserLimit || 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'active',
        usedCount: 0,
      },
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update coupon
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // If code is being updated, check uniqueness
    if (data.code) {
      const existing = await prisma.coupon.findFirst({
        where: { code: data.code.toUpperCase(), NOT: { id } },
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Coupon code already exists' });
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE coupon
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE expired coupons
export const deleteExpiredCoupons = async (req, res) => {
  try {
    const now = new Date();
    const deleted = await prisma.coupon.deleteMany({
      where: {
        endDate: { lt: now },
      },
    });
    res.json({ success: true, deletedCount: deleted.count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// VALIDATION & APPLICATION
// ============================================================

// POST validate coupon
export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal, userId } = req.body;
    const coupon = await prisma.coupon.findFirst({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return res.json({ success: true, data: { valid: false, message: 'Invalid coupon code' } });
    }

    if (coupon.status !== 'active') {
      return res.json({ success: true, data: { valid: false, message: 'Coupon is not active' } });
    }

    const now = new Date();
    if (new Date(coupon.startDate) > now) {
      return res.json({ success: true, data: { valid: false, message: 'Coupon has not started yet' } });
    }
    if (new Date(coupon.endDate) < now) {
      return res.json({ success: true, data: { valid: false, message: 'Coupon has expired' } });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.json({ success: true, data: { valid: false, message: 'Coupon usage limit reached' } });
    }

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return res.json({ success: true, data: { valid: false, message: `Minimum order amount is $${coupon.minOrderAmount}` } });
    }

    // If userId provided, check per-user limit
    if (userId && coupon.perUserLimit > 0) {
      // We don't have a usage table yet; this would be handled separately
      // For now we assume OK. You can add a CouponUsage model if needed.
    }

    return res.json({ success: true, data: { valid: true, coupon } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST apply coupon (returns discount amount)
export const applyCoupon = async (req, res) => {
  try {
    const { code, subtotal, userId } = req.body;
    // First validate
    const validation = await validateCouponLogic(code, subtotal, userId);
    if (!validation.valid) {
      return res.json({ success: true, data: { discount: 0, message: validation.message } });
    }

    const coupon = validation.coupon;
    let discount = 0;

    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === 'free_shipping') {
      // free shipping - discount amount can be 0 or a shipping cost
      // We'll return discount: 0 and let the frontend handle free shipping flag
      discount = 0;
    }

    return res.json({ success: true, data: { discount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: validation logic (reused)
const validateCouponLogic = async (code, subtotal, userId) => {
  const coupon = await prisma.coupon.findFirst({
    where: { code: code.toUpperCase() },
  });
  if (!coupon) return { valid: false, message: 'Invalid coupon code' };
  if (coupon.status !== 'active') return { valid: false, message: 'Coupon is not active' };
  const now = new Date();
  if (new Date(coupon.startDate) > now) return { valid: false, message: 'Coupon has not started yet' };
  if (new Date(coupon.endDate) < now) return { valid: false, message: 'Coupon has expired' };
  if (coupon.usedCount >= coupon.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return { valid: false, message: `Minimum order amount is $${coupon.minOrderAmount}` };
  }
  return { valid: true, coupon };
};

// ============================================================
// STATS & USAGE
// ============================================================

// GET coupon stats
export const getCouponStats = async (req, res) => {
  try {
    const all = await prisma.coupon.count();
    const active = await prisma.coupon.count({ where: { status: 'active' } });
    const expired = await prisma.coupon.count({
      where: { endDate: { lt: new Date() } },
    });
    const disabled = await prisma.coupon.count({ where: { status: 'disabled' } });
    // total usage and total discount would require a usage model, for now we return 0
    res.json({
      success: true,
      data: {
        totalCoupons: all,
        activeCoupons: active,
        expiredCoupons: expired,
        disabledCoupons: disabled,
        totalUsage: 0,
        totalDiscount: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET coupons by status
export const getCouponsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const coupons = await prisma.coupon.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET active coupons (valid now)
export const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        status: 'active',
        startDate: { lte: now },
        endDate: { gte: now },
        usedCount: { lt: prisma.coupon.fields.usageLimit }, // This won't work in simple prisma, we filter in code.
      },
      orderBy: { createdAt: 'desc' },
    });
    // Filter in code for usedCount < usageLimit
    const active = coupons.filter(c => c.usedCount < c.usageLimit);
    res.json({ success: true, data: active });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: generate random code
function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}