const BusinessCategory = require("../models/BusinessCategory");
const { createAuditLog } = require("./auditLogController"); // Import your audit trail helper

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // 1. FIXED LAYER: Case-insensitive duplicate check using a regex pattern match
    const existing = await BusinessCategory.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A business category with this exact name already exists"
      });
    }

    const category = await BusinessCategory.create({
      name: name.trim(),
      description
    });

    // 2. Commit event metadata block to the security ledger
    await createAuditLog({
      userId: req.user?._id,
      module: "Business",
      action: "Business Category Created",
      oldValue: "None",
      newValue: JSON.stringify({ categoryId: category._id, name: category.name }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({
      success: true,
      message: "Business category created successfully",
      category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await BusinessCategory.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await BusinessCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    return res.status(200).json({
      success: true,
      category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const existingCategory = await BusinessCategory.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Check name changes for duplicate safety using regex patterns
    if (req.body.name && req.body.name.toLowerCase() !== existingCategory.name.toLowerCase()) {
      const duplicateCheck = await BusinessCategory.findOne({
        name: { $regex: `^${req.body.name.trim()}$`, $options: "i" }
      });
      if (duplicateCheck) {
        return res.status(400).json({ success: false, message: "Cannot rename: That business category name already exists" });
      }
    }

    const category = await BusinessCategory.findByIdAndUpdate(
      req.params.id,
      { ...req.body, name: req.body.name ? req.body.name.trim() : existingCategory.name },
      { new: true, runValidators: true }
    );

    await createAuditLog({
      userId: req.user?._id,
      module: "Business",
      action: "Business Category Updated",
      oldValue: JSON.stringify({ name: existingCategory.name }),
      newValue: JSON.stringify({ name: category.name }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Business category updated successfully",
      category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await BusinessCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    await BusinessCategory.findByIdAndDelete(req.params.id);

    // Commit cascading delete notification event tracking details
    await createAuditLog({
      userId: req.user?._id,
      module: "Business",
      action: "Business Category Deleted",
      oldValue: JSON.stringify({ name: category.name, id: category._id }),
      newValue: "Removed",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
