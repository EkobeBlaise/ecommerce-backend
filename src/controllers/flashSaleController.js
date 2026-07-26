import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ===== GET all flash sales (with product details) =====
export const getFlashSales = async (req, res) => {
  try {
    const flashSales = await prisma.flashSale.findMany({
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    // Format for frontend
    const formatted = flashSales.map(fs => ({
      id: fs.id,
      productId: fs.productId,
      productName: fs.product.name,
      productImage: fs.product.images ? JSON.parse(fs.product.images)[0] : '',
      originalPrice: fs.product.price,
      salePrice: fs.salePrice,
      discount: fs.discount,
      stock: fs.stock,
      soldCount: fs.soldCount,
      startDate: fs.startDate.toISOString().split('T')[0],
      endDate: fs.endDate.toISOString().split('T')[0],
      isActive: fs.isActive,
      limitPerCustomer: fs.limitPerCustomer,
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET single flash sale by ID =====
export const getFlashSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const flashSale = await prisma.flashSale.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!flashSale) {
      return res.status(404).json({ success: false, message: 'Flash sale not found' });
    }
    const formatted = {
      id: flashSale.id,
      productId: flashSale.productId,
      productName: flashSale.product.name,
      productImage: flashSale.product.images ? JSON.parse(flashSale.product.images)[0] : '',
      originalPrice: flashSale.product.price,
      salePrice: flashSale.salePrice,
      discount: flashSale.discount,
      stock: flashSale.stock,
      soldCount: flashSale.soldCount,
      startDate: flashSale.startDate.toISOString().split('T')[0],
      endDate: flashSale.endDate.toISOString().split('T')[0],
      isActive: flashSale.isActive,
      limitPerCustomer: flashSale.limitPerCustomer,
    };
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== CREATE flash sale =====
export const createFlashSale = async (req, res) => {
  try {
    const { productId, salePrice, stock, startDate, endDate, limitPerCustomer } = req.body;
    
    // Get product to compute discount
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (salePrice >= product.price) {
      return res.status(400).json({ success: false, message: 'Sale price must be less than original price' });
    }
    const discount = Math.round(((product.price - salePrice) / product.price) * 100);

    // Check if product already has a flash sale
    const existing = await prisma.flashSale.findFirst({ where: { productId } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Product already has a flash sale' });
    }

    const flashSale = await prisma.flashSale.create({
      data: {
        productId,
        salePrice,
        discount,
        stock: stock || product.stock,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        limitPerCustomer: limitPerCustomer || 2,
        isActive: true,
      },
      include: { product: true },
    });

    // Optionally update product with flag
    await prisma.product.update({
      where: { id: productId },
      data: { tags: JSON.stringify([...JSON.parse(product.tags || '[]'), 'flash_sale']) },
    });

    const formatted = {
      id: flashSale.id,
      productId: flashSale.productId,
      productName: flashSale.product.name,
      productImage: flashSale.product.images ? JSON.parse(flashSale.product.images)[0] : '',
      originalPrice: flashSale.product.price,
      salePrice: flashSale.salePrice,
      discount: flashSale.discount,
      stock: flashSale.stock,
      soldCount: flashSale.soldCount,
      startDate: flashSale.startDate.toISOString().split('T')[0],
      endDate: flashSale.endDate.toISOString().split('T')[0],
      isActive: flashSale.isActive,
      limitPerCustomer: flashSale.limitPerCustomer,
    };
    res.status(201).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== UPDATE flash sale =====
export const updateFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { salePrice, stock, startDate, endDate, limitPerCustomer, isActive } = req.body;

    const existing = await prisma.flashSale.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Flash sale not found' });
    }

    // Recalculate discount if salePrice changes
    let discount = existing.discount;
    if (salePrice !== undefined && salePrice !== existing.salePrice) {
      if (salePrice >= existing.product.price) {
        return res.status(400).json({ success: false, message: 'Sale price must be less than original price' });
      }
      discount = Math.round(((existing.product.price - salePrice) / existing.product.price) * 100);
    }

    const updated = await prisma.flashSale.update({
      where: { id },
      data: {
        salePrice: salePrice || existing.salePrice,
        discount,
        stock: stock !== undefined ? stock : existing.stock,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        limitPerCustomer: limitPerCustomer || existing.limitPerCustomer,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
      include: { product: true },
    });

    const formatted = {
      id: updated.id,
      productId: updated.productId,
      productName: updated.product.name,
      productImage: updated.product.images ? JSON.parse(updated.product.images)[0] : '',
      originalPrice: updated.product.price,
      salePrice: updated.salePrice,
      discount: updated.discount,
      stock: updated.stock,
      soldCount: updated.soldCount,
      startDate: updated.startDate.toISOString().split('T')[0],
      endDate: updated.endDate.toISOString().split('T')[0],
      isActive: updated.isActive,
      limitPerCustomer: updated.limitPerCustomer,
    };
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== DELETE flash sale =====
export const deleteFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.flashSale.delete({ where: { id } });
    res.json({ success: true, message: 'Flash sale deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};