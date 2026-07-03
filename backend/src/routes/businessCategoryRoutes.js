const express = require("express");
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require("../controllers/businessCategoryController");
const { protect } = require("../middlewares/authMiddleware"); // Import your security protection middleware
const authorize = require("../middlewares/roleMiddleware"); // Import your role checking middleware

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PUBLIC ADMIN READ OPERATIONS (Protected by Session Token)
|--------------------------------------------------------------------------
*/
router.get("/", protect, getCategories);
router.get("/:id", protect, getCategoryById);

/*
|--------------------------------------------------------------------------
| RESTRICTED WRITE OPERATIONS (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
*/
router.post("/", protect, authorize("SuperAdmin", "BusinessAdmin"), createCategory);
router.put("/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), updateCategory);
router.delete("/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), deleteCategory);

module.exports = router;
