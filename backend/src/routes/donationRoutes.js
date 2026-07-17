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
const { createCampaign, getCampaigns, closeCampaign, reopenCampaign } = require("../controllers/donationCampaignController"); 
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

router.get("/", protect, authorize("SuperAdmin", "DonationAdmin"), getDonations); 
router.patch("/:id/approve", protect, authorize("SuperAdmin", "DonationAdmin"), approveDonation); 
router.patch("/:id/reject", protect, authorize("SuperAdmin", "DonationAdmin"), rejectDonation); 

// FIXED LAYER: Inline, independent deletion controller to completely isolate Render from compiler failures
router.delete("/campaigns/:id", protect, authorize("SuperAdmin", "DonationAdmin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const DonationCampaign = mongoose.model("DonationCampaign");
    
    const campaign = await DonationCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Donation campaign profile not found." });
    }

    // Try to safely log the audit trail if the controller is available
    try {
      const { createAuditLog } = require("../controllers/auditLogController");
      await createAuditLog({
        userId: req.user?._id,
        module: "Donation Campaign",
        action: "Campaign Deleted",
        oldValue: JSON.stringify({ id: campaign._id, title: campaign.title }),
        newValue: "DELETED_PERMANENTLY",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
    } catch (auditError) {
      console.log("Audit log skipped or controller path shifted:", auditError.message);
    }

    return res.status(200).json({ 
      success: true, 
      message: `Charity fund channel "${campaign.title}" has been permanently deleted.` 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
