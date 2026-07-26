import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ===== GET all brands =====
export const getBrands = async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET brand by ID =====
export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET brands with product count =====
export const getBrandsWithCount = async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    const data = brands.map(b => ({
      ...b,
      productsCount: b._count.products,
    }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== CREATE brand =====
export const createBrand = async (req, res) => {
  try {
    const { name, slug, logo, description, website, featured, status } = req.body;
    // Ensure slug is unique
    const existing = await prisma.brand.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Brand with this slug already exists' });
    }
    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        logo: logo || '',
        description: description || '',
        website: website || '',
        featured: featured || false,
        status: status || 'active',
      },
    });
    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== UPDATE brand =====
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    // If slug is changing, check uniqueness
    if (data.slug) {
      const existing = await prisma.brand.findUnique({ where: { slug: data.slug } });
      if (existing && existing.id !== id) {
        return res.status(409).json({ success: false, message: 'Slug already in use' });
      }
    }
    const brand = await prisma.brand.update({
      where: { id },
      data,
    });
    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== DELETE brand =====
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if any products use this brand
    const products = await prisma.product.findMany({ where: { brandId: id } });
    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete brand: it is used by ${products.length} product(s)`,
      });
    }
    await prisma.brand.delete({ where: { id } });
    res.json({ success: true, message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};