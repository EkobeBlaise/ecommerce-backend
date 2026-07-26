import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryGroups,
  getCategoryGroupsByCategoryId,   // ✅ NEW
  getCategoryGroupsByCategorySlug, // ✅ NEW
  createCategoryGroup,
  updateCategoryGroup,
  deleteCategoryGroup,
  getSubCategories,
  getSubCategoriesByGroupId,       // ✅ NEW
  createSubCategory,
  updateSubCategory,
  deleteSubCategory
} from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// ===== STATIC ROUTES (must come before dynamic :id) =====
router.get('/groups', getCategoryGroups);                    // ✅ /categories/groups
router.get('/subcategories', getSubCategories);             // ✅ /categories/subcategories

// ===== NESTED ROUTES (for category groups) =====
// ✅ IMPORTANT: These must come BEFORE /:id routes
router.get('/:categoryId/groups', getCategoryGroupsByCategoryId);      // ✅ /categories/:categoryId/groups
router.get('/slug/:slug/groups', getCategoryGroupsByCategorySlug);    // ✅ /categories/slug/:slug/groups

// ===== SUB-CATEGORIES BY GROUP =====
router.get('/groups/:groupId/subcategories', getSubCategoriesByGroupId); // ✅ /categories/groups/:groupId/subcategories

// ===== DYNAMIC ROUTES (with :id) =====
router.get('/', getCategories);                     // ✅ /categories
router.get('/:id', getCategoryById);                // ✅ /categories/abc123
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

// ===== GROUP CRUD =====
router.post('/groups', protect, admin, createCategoryGroup);
router.put('/groups/:id', protect, admin, updateCategoryGroup);
router.delete('/groups/:id', protect, admin, deleteCategoryGroup);

// ===== SUB-CATEGORY CRUD =====
router.post('/subcategories', protect, admin, createSubCategory);
router.put('/subcategories/:id', protect, admin, updateSubCategory);
router.delete('/subcategories/:id', protect, admin, deleteSubCategory);

export default router;