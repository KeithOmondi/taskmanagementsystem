import { Router } from "express";
import * as CategoryController from "../controllers/category.controller";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";

const router = Router();

/**
 * @GET /api/categories/tree
 * Returns a nested hierarchical structure (Headers -> Children)
 */
router.get("/tree", protect, authorizeRoles("superadmin"), CategoryController.getCategoryTree);

/**
 * @GET /api/categories
 * Returns a flat list of all categories
 */
router.get("/get", protect, authorizeRoles("superadmin"), CategoryController.getAllCategories);

/**
 * @POST /api/categories
 * Create a new category or sub-category
 * (Recommendation: Add Admin Middleware here)
 */
router.post("/category", protect, authorizeRoles("superadmin"), CategoryController.createCategory);

/**
 * @PATCH /api/categories/:id
 * Update an existing category (handles slug regeneration)
 */
router.patch("/update/:id", protect, authorizeRoles("superadmin"), CategoryController.updateCategory);

/**
 * @DELETE /api/categories/:id
 * Removes a category and its sub-items
 */
router.delete("/delete/:id", protect, authorizeRoles("superadmin"), CategoryController.deleteCategory);

export default router;