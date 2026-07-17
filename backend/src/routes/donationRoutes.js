// const express = require("express"); 
// const { 
//   createCampaign, 
//   getCampaigns, 
//   closeCampaign, 
//   reopenCampaign 
// } = require("../controllers/donationCampaignController"); 
// const { submitDonation, getDonations } = require("../controllers/donationController"); 
// const { approveDonation, rejectDonation } = require("../controllers/donationApprovalController"); 
// const { protect } = require("../middlewares/authMiddleware"); 
// const authorize = require("../middlewares/roleMiddleware"); 

// const router = express.Router(); 

// router.get("/campaigns", protect, getCampaigns); 
// router.post("/", protect, submitDonation); 

// router.post("/campaigns", protect, authorize("SuperAdmin", "DonationAdmin"), createCampaign); 
// router.patch("/campaigns/:id/close", protect, authorize("SuperAdmin", "DonationAdmin"), closeCampaign); 
// router.patch("/campaigns/:id/reopen", protect, authorize("SuperAdmin", "DonationAdmin"), reopenCampaign); 

// router.get("/", protect, authorize("SuperAdmin", "DonationAdmin"), getDonations); 
// router.patch("/:id/approve", protect, authorize("SuperAdmin", "DonationAdmin"), approveDonation); 
// router.patch("/:id/reject", protect, authorize("SuperAdmin", "DonationAdmin"), rejectDonation); 

// module.exports = router;
const express = require("express"); 
const { 
  createCampaign, 
  getCampaigns, 
  closeCampaign, 
  reopenCampaign,
  deleteCampaign // FIXED BINDING: Imports your custom backend deletion controller function
} = require("../controllers/donationCampaignController"); 
const { submitDonation, getDonations } = require("../controllers/donationController"); 
const { approveDonation, rejectDonation } = require("../controllers/donationApprovalController"); 
const { protect } = require("../middlewares/authMiddleware"); 
const authorize = require("../middlewares/roleMiddleware"); 

const router = express.Router(); 

router.get("/campaigns", protect, getCampaigns); 
router.post("/", protect, submitDonation); 

router.post("/campaigns", protect, authorize("SuperAdmin", "DonationAdmin"), createCampaign); 
router.patch("/campaigns/:id/close", protect, authorize("SuperAdmin", "DonationAdmin"), closeCampaign); 
router.patch("/campaigns/:id/reopen", protect, authorize("SuperAdmin", "DonationAdmin"), reopenCampaign); 

// FIXED LAYER ROUTE: Intercepts the DELETE network call and directs it straight to the deletion controller handler
router.delete("/campaigns/:id", protect, authorize("SuperAdmin", "DonationAdmin"), deleteCampaign);

router.get("/", protect, authorize("SuperAdmin", "DonationAdmin"), getDonations); 
router.patch("/:id/approve", protect, authorize("SuperAdmin", "DonationAdmin"), approveDonation); 
router.patch("/:id/reject", protect, authorize("SuperAdmin", "DonationAdmin"), rejectDonation); 

module.exports = router;
