// backend/src/controllers/categoryController.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// CATEGORIES
// ============================================================

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        categoryGroups: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            subCategories: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        categoryGroups: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            subCategories: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await prisma.category.create({
      data: req.body
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.category.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// ============================================================
// CATEGORY GROUPS
// ============================================================

// ✅ Get all category groups
export const getCategoryGroups = async (req, res) => {
  try {
    const groups = await prisma.categoryGroup.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        category: true,
        subCategories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Error fetching category groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category groups',
      error: error.message
    });
  }
};

// ✅ NEW: Get category groups by category ID
export const getCategoryGroupsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const groups = await prisma.categoryGroup.findMany({
      where: {
        categoryId: categoryId,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Error fetching category groups by category ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category groups',
      error: error.message
    });
  }
};

// ✅ NEW: Get category groups by category slug
export const getCategoryGroupsByCategorySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { slug }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const groups = await prisma.categoryGroup.findMany({
      where: {
        categoryId: category.id,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Error fetching category groups by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category groups',
      error: error.message
    });
  }
};

export const createCategoryGroup = async (req, res) => {
  try {
    const group = await prisma.categoryGroup.create({
      data: req.body
    });

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error creating category group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category group',
      error: error.message
    });
  }
};

export const updateCategoryGroup = async (req, res) => {
  try {
    const { id } = req.params;
    
    const group = await prisma.categoryGroup.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error updating category group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category group',
      error: error.message
    });
  }
};

export const deleteCategoryGroup = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.categoryGroup.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Category group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category group',
      error: error.message
    });
  }
};

// ============================================================
// SUB-CATEGORIES
// ============================================================

// ✅ Get all sub-categories
export const getSubCategories = async (req, res) => {
  try {
    const subCategories = await prisma.subCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        categoryGroup: {
          include: {
            category: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    console.error('Error fetching sub-categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-categories',
      error: error.message
    });
  }
};

// ✅ NEW: Get sub-categories by group ID
export const getSubCategoriesByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const subCategories = await prisma.subCategory.findMany({
      where: {
        categoryGroupId: groupId,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    console.error('Error fetching sub-categories by group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-categories',
      error: error.message
    });
  }
};

export const createSubCategory = async (req, res) => {
  try {
    const subCategory = await prisma.subCategory.create({
      data: req.body
    });

    res.status(201).json({
      success: true,
      data: subCategory
    });
  } catch (error) {
    console.error('Error creating sub-category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sub-category',
      error: error.message
    });
  }
};

export const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subCategory = await prisma.subCategory.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      data: subCategory
    });
  } catch (error) {
    console.error('Error updating sub-category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sub-category',
      error: error.message
    });
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.subCategory.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Sub-category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sub-category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sub-category',
      error: error.message
    });
  }
};