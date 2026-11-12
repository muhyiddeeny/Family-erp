const express = require("express");
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require("../controllers/businessCategoryController");
const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const ensureDefaultCategories = require("../utils/ensureDefaultCategories");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| READ OPERATIONS (Protected by Session Token)
| The first request after a server start also makes sure the 6 standard
| categories exist: Farming, Livestock, Transportation, Trading,
| Real Estate and Others.
|--------------------------------------------------------------------------
*/
router.get("/", protect, ensureDefaultCategories, getCategories);
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
