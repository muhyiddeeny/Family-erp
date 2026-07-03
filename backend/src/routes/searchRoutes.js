const express = require("express");
const { globalSearch } = require("../controllers/searchController");
const { protect } = require("../middlewares/authMiddleware"); // Import your token validation guard

const router = express.Router();

/*
|--------------------------------------------------------------------------
| SECURE GLOBAL MULTI-SYSTEM SEARCH ENDPOINT
|--------------------------------------------------------------------------
| Appending 'protect' ensures that only valid, logged-in family members or 
| administrators can run search queries against your data collections.
*/
router.get("/", protect, globalSearch);

module.exports = router;
