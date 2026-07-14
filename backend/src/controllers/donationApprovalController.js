// const Donation = require("../models/Donation");
// const DonationCampaign = require("../models/DonationCampaign");
// const Notification = require("../models/Notification");
// const { createAuditLog } = require("./auditLogController");

// const approveDonation = async (req, res) => {
//   try {
//     const donation = await Donation.findById(req.params.id);

//     if (!donation) {
//       return res.status(404).json({
//         success: false,
//         message: "Donation record not found"
//       });
//     }

//     // 1. DYNAMIC FLAGGING SAFETY CHECK (Fixes campaign balance overwrite loop bug)
//     if (donation.status === "Approved") {
//       return res.status(400).json({
//         success: false,
//         message: "Action denied: This donation has already been verified and approved"
//       });
//     }

//     donation.status = "Approved";
//     donation.paymentVerified = true;
//     donation.paymentVerifiedAt = new Date();
//     await donation.save();

//     // 2. Increment target platform campaign fund accumulator atomically
//     await DonationCampaign.findByIdAndUpdate(
//       donation.campaignId,
//       { $inc: { amountRaised: donation.amount } }
//     );

//     // 3. Dispatch system notification alert directly to member dashboard feed
//     await Notification.create({
//       memberId: donation.memberId,
//       title: "Donation Deposit Approved",
//       message: `Your donation contribution has been verified and credited. Thank you for your support!`,
//       type: "DonationApproval"
//     });

//     // 4. Log the administrative operation to your secure system audit ledger trail
//     await createAuditLog({
//       userId: req.user?._id,
//       module: "Donation Approval",
//       action: "Donation Approved",
//       oldValue: "Pending",
//       newValue: JSON.stringify({ donationId: donation._id, amount: donation.amount }),
//       ipAddress: req.ip,
//       userAgent: req.headers["user-agent"]
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Donation verified successfully and metrics updated",
//       donation
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const rejectDonation = async (req, res) => {
//   try {
//     const donation = await Donation.findById(req.params.id);

//     if (!donation) {
//       return res.status(404).json({
//         success: false,
//         message: "Donation record not found"
//       });
//     }

//     if (donation.status === "Rejected") {
//       return res.status(400).json({
//         success: false,
//         message: "This donation record has already been rejected."
//       });
//     }

//     donation.status = "Rejected";
//     donation.adminRemark = req.body.adminRemark || "Unverified payment transaction proof.";
//     await donation.save();

//     // Dispatch profile rejection notice feed alert
//     await Notification.create({
//       memberId: donation.memberId,
//       title: "Donation Proof Rejected",
//       message: `Your donation submission could not be verified. Reason: ${donation.adminRemark}`,
//       type: "DonationRejection"
//     });

//     // Write transaction audit trace mapping block
//     await createAuditLog({
//       userId: req.user?._id,
//       module: "Donation Approval",
//       action: "Donation Rejected",
//       oldValue: "Pending",
//       newValue: "Rejected",
//       ipAddress: req.ip,
//       userAgent: req.headers["user-agent"]
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Donation request successfully rejected",
//       donation
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// module.exports = {
//   approveDonation,
//   rejectDonation
// };
const mongoose = require("mongoose"); // FIXED LAYER: Direct mongoose core link to avoid model collision loops
const { createAuditLog } = require("./auditLogController"); 

const createCampaign = async (req, res) => { 
  try { 
    // Safely retrieve the already registered model out of active cache cache memory
    const DonationCampaign = mongoose.model("DonationCampaign");

    const { 
      title, 
      description, 
      targetAmount, 
      category, 
      campaignType, 
      endDate 
    } = req.body;

    const campaign = await DonationCampaign.create({ 
      title: (title || "Community Welfare Fund").trim(),
      description: (description || "Public donation campaign portal registry cluster").trim(),
      targetAmount: Number(targetAmount) || 0,
      
      // FIXED AUTOMATED FALLBACK LAYER: Injects a hardcoded value if the frontend leaves it empty or undefined
      category: (category && category.trim()) ? category.trim() : "General Welfare",
      
      campaignType: campaignType || "General",
      endDate: endDate || null,
      status: "OPEN", // Explicitly enforce default active state upon initialization 
      amountRaised: 0 // Safety: Enforce baseline accumulator to prevent addition calculations from hitting NaN errors 
    }); 

    // Capture the deployment event securely inside the audit ledger 
    await createAuditLog({ 
      userId: req.user?._id || req.body.adminId, 
      module: "Donation Campaign", 
      action: "Campaign Created", 
      oldValue: "None", 
      newValue: JSON.stringify({ id: campaign._id, title: campaign.title, type: campaign.campaignType }), 
      ipAddress: req.ip, 
      userAgent: req.headers["user-agent"] 
    }); 

    return res.status(201).json({ 
      success: true, 
      message: "Public donation campaign initialized and open for contributions", 
      campaign 
    }); 

  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const getCampaigns = async (req, res) => { 
  try { 
    const DonationCampaign = mongoose.model("DonationCampaign");
    const campaigns = await DonationCampaign.find().sort({ createdAt: -1 }); 
    return res.status(200).json({ success: true, count: campaigns.length, campaigns }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const closeCampaign = async (req, res) => { 
  try { 
    const DonationCampaign = mongoose.model("DonationCampaign");
    const campaign = await DonationCampaign.findByIdAndUpdate( 
      req.params.id, 
      { status: "CLOSED" }, 
      { new: true } 
    ); 
    if (!campaign) { 
      return res.status(404).json({ success: false, message: "Donation campaign profile not found" }); 
    } 
    // Write close history tracking mapping details 
    await createAuditLog({ 
      userId: req.user?._id, 
      module: "Donation Campaign", 
      action: "Campaign Closed", 
      oldValue: "OPEN", 
      newValue: "CLOSED", 
      ipAddress: req.ip, 
      userAgent: req.headers["user-agent"] 
    }); 
    return res.status(200).json({ success: true, message: "Donation campaign successfully closed. Submissions are now locked.", campaign }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const reopenCampaign = async (req, res) => { 
  try { 
    const DonationCampaign = mongoose.model("DonationCampaign");
    const campaign = await DonationCampaign.findByIdAndUpdate( 
      req.params.id, 
      { status: "OPEN" }, 
      { new: true } 
    ); 
    if (!campaign) { 
      return res.status(404).json({ success: false, message: "Donation campaign profile not found" }); 
    } 
    // Write tracking log 
    await createAuditLog({ 
      userId: req.user?._id, 
      module: "Donation Campaign", 
      action: "Campaign Reopened", 
      oldValue: "CLOSED", 
      newValue: "OPEN", 
      ipAddress: req.ip, 
      userAgent: req.headers["user-agent"] 
    }); 
    return res.status(200).json({ success: true, message: "Donation campaign successfully reopened for public member deposits.", campaign }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

module.exports = { createCampaign, getCampaigns, closeCampaign, reopenCampaign };
