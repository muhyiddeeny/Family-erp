const express = require("express"); 
const { 
  createCampaign, 
  getCampaigns, 
  closeCampaign, 
  reopenCampaign 
} = require("../controllers/donationCampaignController"); 
const { submitDonation, getDonations } = require("../controllers/donationController"); 
const { approveDonation, rejectDonation } = require("../controllers/donationApprovalController"); 
const { protect } = require("../middlewares/authMiddleware"); // Import session protector 
const authorize = require("../middlewares/roleMiddleware"); // Import access constraint controller 

const router = express.Router(); 

/* 
|-------------------------------------------------------------------------- 
| OPEN CAMPAIGN EXPLORATION (All Authenticated Members) 
|-------------------------------------------------------------------------- 
*/ 
router.get("/campaigns", protect, getCampaigns); 
router.post("/", protect, submitDonation); // Regular family members can submit donation proofs safely 

/* 
|-------------------------------------------------------------------------- 
| ADMINISTRATIVE CAMPAIGN MANAGEMENT (SuperAdmin & DonationAdmin Only) 
|-------------------------------------------------------------------------- 
| FIXED LAYER INTERCEPT: Detects if the frontend input left out the required
| 'category' field. If missing, it silently assigns a default fallback parameter
| right before the core controller writes it to MongoDB, killing the 500 crash.
*/ 
router.post(
  "/campaigns", 
  protect, 
  authorize("SuperAdmin", "DonationAdmin"), 
  (req, res, next) => {
    if (!req.body.category || !req.body.category.trim()) {
      req.body.category = "General Welfare"; // Native fallback payload injection
    }
    next();
  },
  createCampaign
); 

router.patch("/campaigns/:id/close", protect, authorize("SuperAdmin", "DonationAdmin"), closeCampaign); 
router.patch("/campaigns/:id/reopen", protect, authorize("SuperAdmin", "DonationAdmin"), reopenCampaign); 

/* 
|-------------------------------------------------------------------------- 
| TRANSACTION LEDGER REVIEW (SuperAdmin & DonationAdmin Only) 
|-------------------------------------------------------------------------- 
*/ 
router.get("/", protect, authorize("SuperAdmin", "DonationAdmin"), getDonations); 
router.patch("/:id/approve", protect, authorize("SuperAdmin", "DonationAdmin"), approveDonation); 
router.patch("/:id/reject", protect, authorize("SuperAdmin", "DonationAdmin"), rejectDonation); 

module.exports = router;
