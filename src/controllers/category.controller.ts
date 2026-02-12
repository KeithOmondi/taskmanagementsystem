import { Request, Response } from "express";
import Category from "../models/categories.model";

/**
 * @desc    Get all categories as a nested tree
 * @route   GET /api/categories/tree
 * * Optimized with a Map to handle O(n) complexity and 
 * strict string conversion for BSON ObjectIDs.
 */
export const getCategoryTree = async (req: Request, res: Response) => {
  try {
    const allCategories = await Category.find().lean();

    // 1. Create a map of all items for O(1) lookup
    const idMap: Record<string, any> = {};
    allCategories.forEach((cat) => {
      idMap[cat._id.toString()] = { ...cat, children: [] };
    });

    const tree: any[] = [];

    // 2. Distribute items into their parent's children array
    allCategories.forEach((cat) => {
      const catWithChildren = idMap[cat._id.toString()];
      const parentId = cat.parentId?.toString();

      if (parentId && idMap[parentId]) {
        // This is a sub-category
        idMap[parentId].children.push(catWithChildren);
      } else {
        // This is a root parent (header)
        tree.push(catWithChildren);
      }
    });

    res.status(200).json({ success: true, data: tree });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create Category or Sub-category
 * @route   POST /api/categories
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, color, parentId, isSystemDefined } = req.body;

    // Ensure parentId is either a valid string or null (not undefined)
    const category = await Category.create({
      name,
      description,
      color,
      parentId: parentId || null,
      isSystemDefined: isSystemDefined || false,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get All Categories (Flat list)
 * @route   GET /api/categories
 */
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find()
      .populate("parentId", "name")
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Category
 * @route   PATCH /api/categories/:id
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Object.assign + save() ensures slug middleware runs correctly
    Object.assign(category, req.body);
    await category.save();

    res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete Category & its children
 * @route   DELETE /api/categories/:id
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (category.isSystemDefined) {
      return res.status(403).json({
        success: false,
        message: "This is a core system category and cannot be deleted.",
      });
    }

    // Cleanup: Delete sub-categories first
    await Category.deleteMany({ parentId: id });
    await category.deleteOne();

    res.status(200).json({ success: true, message: "Category and sub-items removed." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};