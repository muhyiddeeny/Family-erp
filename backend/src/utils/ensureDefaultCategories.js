const BusinessCategory = require("../models/BusinessCategory");

const DEFAULT_CATEGORIES = [
  { name: "Farming", description: "Crop and agricultural production projects." },
  { name: "Livestock", description: "Poultry, fish, cattle and other livestock projects." },
  { name: "Transportation", description: "Vehicles, logistics and transport projects." },
  { name: "Trading", description: "Buying, selling and general trade projects." },
  { name: "Real Estate", description: "Property and land projects." },
  { name: "Others", description: "Any project that does not fit the categories above." }
];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let seeded = false;

// Makes sure the 6 standard business categories exist (runs once per server start).
// Existing categories are never changed, and a category that already exists is not duplicated.
const ensureDefaultCategories = async (req, res, next) => {
  if (!seeded) {
    try {
      for (const category of DEFAULT_CATEGORIES) {
        await BusinessCategory.updateOne(
          { name: new RegExp(`^${escapeRegex(category.name)}$`, "i") },
          { $setOnInsert: { name: category.name, description: category.description, isActive: true } },
          { upsert: true }
        );
      }
      seeded = true;
    } catch (error) {
      console.error("Default business category setup failed:", error.message);
    }
  }
  next();
};

module.exports = ensureDefaultCategories;
