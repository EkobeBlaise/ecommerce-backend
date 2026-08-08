import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../utils/generateSlug.js';

const prisma = new PrismaClient();

// ===== GET all products (PUBLIC facing) =====
export const getProducts = async (req, res) => {
  try {
    const {
      gender, category, subcategory, categoryGroup,
      categorySlug, groupSlug, subSlug,
      search, isNew, isSale, isTrending,
      minPrice, maxPrice
    } = req.query;

    const where = { status: 'active' };

    // 1. 🛡️ RESOLVE SLUGS TO DATABASE NAMES
    let resolvedCategory = null, resolvedGroup = null, resolvedSub = null;

    if (categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) resolvedCategory = cat.name;
    }
    if (groupSlug) {
      const grp = await prisma.categoryGroup.findUnique({ where: { slug: groupSlug } });
      if (grp) resolvedGroup = grp.name;
    }
    if (subSlug) {
      const sub = await prisma.subCategory.findUnique({ where: { slug: subSlug } });
      if (sub) resolvedSub = sub.name;
    }

    // 2. APPLY THE RESOLVED NAMES TO WHERE CLAUSE
    if (resolvedCategory) where.category = resolvedCategory;
    if (resolvedGroup) where.categoryGroup = resolvedGroup;
    if (resolvedSub) where.subcategory = resolvedSub;

    // 3. LEGACY SUPPORT (in case frontend sends names directly)
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (categoryGroup) where.categoryGroup = categoryGroup;

    // 4. REMAINING FILTERS
    if (gender) where.gender = gender;
    if (isNew === 'true') where.isNew = true;
    if (isSale === 'true') where.isSale = true;
    if (isTrending === 'true') where.isTrending = true;

    // Price range (safe parsing)
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Search – NO `mode` (MySQL compatibility)
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.OR = [
        { name: { contains: search } },
        { brandName: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: { variants: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET all products for ADMIN (Includes draft & archived) =====
export const getAdminProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true, reviews: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET product by ID =====
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
      include: { variants: true, reviews: true }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== CREATE product =====
export const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    const slug = generateSlug(productData.name);

    console.log('📦 Creating product:', productData.name);

    // Build tags
    const tags = [];
    if (productData.gender) tags.push(productData.gender);
    if (productData.category) tags.push(productData.category.toLowerCase());
    if (productData.subcategory) tags.push(productData.subcategory.toLowerCase());
    if (productData.brand) tags.push(productData.brand.toLowerCase());
    if (productData.isNew) tags.push('new');
    if (productData.isSale) tags.push('sale');
    if (productData.isTrending) tags.push('trending');
    if (productData.isBestseller) tags.push('bestseller');

    const data = {
      name: productData.name,
      slug,
      description: productData.description || '',
      price: parseFloat(productData.price) || 0,
      comparePrice: productData.oldPrice ? parseFloat(productData.oldPrice) : null,
      gender: productData.gender || 'unisex',
      category: productData.category || '',
      subcategory: productData.subcategory || '',
      categoryGroup: productData.categoryGroup || '',
      brandName: productData.brand || '',
      images: JSON.stringify(productData.images || [productData.image || '']),
      stockQuantity: parseInt(productData.stock_quantity) || 0,
      sku: productData.sku || '',
      isNew: productData.isNew || false,
      isSale: productData.isSale || false,
      isTrending: productData.isTrending || false,
      isBestseller: productData.isBestseller || false,
      isSizeInclusive: productData.isSizeInclusive || false,
      isMaternity: productData.isMaternity || false,
      isAdaptive: productData.isAdaptive || false,
      status: productData.status || 'active',
      tags: JSON.stringify(tags),
    };

    if (productData.brand_id) {
      data.brandId = productData.brand_id;
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        variants: {
          create: (productData.variants || []).map((v) => ({
            size: v.size || '',
            color: v.color || '',
            sku: v.sku || '',
            stock: parseInt(v.stock) || 0,
            price: v.price ? parseFloat(v.price) : null,
          }))
        }
      },
      include: { variants: true }
    });

    console.log('✅ Product created:', product.id);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('❌ Create product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== UPDATE product =====
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('🔄 Updating product:', id);

    const data = {};

    const scalarFields = [
      'name', 'description', 'price', 'comparePrice', 'gender',
      'category', 'subcategory', 'categoryGroup',
      'brandName', 'stockQuantity', 'sku', 'status',
      'isNew', 'isSale', 'isTrending', 'isBestseller',
      'isSizeInclusive', 'isMaternity', 'isAdaptive',
    ];
    scalarFields.forEach(field => {
      if (updates[field] !== undefined) {
        data[field] = updates[field];
      }
    });

    if (updates.oldPrice !== undefined) {
      data.comparePrice = updates.oldPrice;
    }
    if (updates.stock_quantity !== undefined) {
      data.stockQuantity = updates.stock_quantity;
    }
    if (updates.brand !== undefined && !updates.brand_id) {
      data.brandName = updates.brand;
    }

    if (updates.brand_id !== undefined) {
      data.brandId = (updates.brand_id && updates.brand_id.trim() !== '')
        ? updates.brand_id
        : null;
    }

    if (updates.images !== undefined) {
      data.images = Array.isArray(updates.images)
        ? JSON.stringify(updates.images)
        : updates.images;
    }
    if (updates.tags !== undefined) {
      if (Array.isArray(updates.tags)) {
        data.tags = JSON.stringify(updates.tags);
      } else if (typeof updates.tags === 'string') {
        try {
          const parsed = JSON.parse(updates.tags);
          data.tags = Array.isArray(parsed) ? JSON.stringify(parsed) : updates.tags;
        } catch {
          data.tags = updates.tags;
        }
      }
    }

    if (updates.name) {
      let baseSlug = generateSlug(updates.name);
      let finalSlug = baseSlug;
      let counter = 1;

      let existing = await prisma.product.findFirst({
        where: {
          slug: finalSlug,
          NOT: { id }
        }
      });
      while (existing) {
        finalSlug = `${baseSlug}-${counter}`;
        existing = await prisma.product.findFirst({
          where: {
            slug: finalSlug,
            NOT: { id }
          }
        });
        counter++;
      }
      data.slug = finalSlug;
    }

    let variantData = undefined;
    if (updates.variants !== undefined) {
      await prisma.variant.deleteMany({ where: { productId: id } });
      if (Array.isArray(updates.variants) && updates.variants.length > 0) {
        variantData = {
          create: updates.variants.map(v => ({
            size: v.size || '',
            color: v.color || '',
            sku: v.sku || '',
            stock: parseInt(v.stock) || 0,
            price: v.price ? parseFloat(v.price) : null,
          }))
        };
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        variants: variantData,
      },
      include: { variants: true }
    });

    res.json({ success: true, data: product });

  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== DELETE product =====
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== DELETE multiple products =====
export const deleteManyProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await prisma.product.deleteMany({
      where: { id: { in: ids } }
    });
    res.json({ success: true, deletedCount: result.count });
  } catch (error) {
    console.error('Delete many products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};