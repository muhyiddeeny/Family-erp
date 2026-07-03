const mongoose = require("mongoose");
const dotenv = require("dotenv");
const BusinessCategory = require("../models/BusinessCategory");

dotenv.config();

const categories = [
  { name: "Farming", description: "Agricultural cultivation and crop management operations.", module: "Agriculture" },
  { name: "Livestock", description: "Animal husbandry, poultry processing, and livestock management.", module: "Agriculture" },
  { name: "Transportation", description: "Logistics, supply chain movements, and transit services.", module: "Logistics" },
  { name: "Trading", description: "Commercial wholesale distribution and marketplace commodity trading.", module: "Commerce" },
  { name: "Real Estate", description: "Property management, land development, and structural acquisitions.", module: "Property" },
  { name: "Others", description: "Miscellaneous corporate operations and general enterprise assets.", module: "General" }
];

const seed = async () => {
  try {
    console.log("[SEEDER]: Connecting to database server...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[SEEDER]: Connection successful.");

    // 1. Wipe out stale category entries to prevent duplicate key constraint crashes
    await BusinessCategory.deleteMany();

    // 2. Insert new, fully compatible structural category definitions
    await BusinessCategory.insertMany(categories);

    console.log("🚀 [SEEDER]: Business categories seeded successfully into MongoDB collection!");
    
    // 3. Gracefully terminate the database connection pool channel
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ [SEEDER CRITICAL EXCEPTION]:", error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seed();
