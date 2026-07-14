// const DonationCampaign = require("../models/DonationCampaign");
// const { createAuditLog } = require("./auditLogController");

// const createCampaign = async (req, res) => {
//   try {
//     const campaign = await DonationCampaign.create({
//       ...req.body,
//       status: "OPEN", // FIXED LAYER: Explicitly enforce default active state upon initialization
//       amountRaised: 0 // Safety: Enforce baseline accumulator to prevent addition calculations from hitting NaN errors
//     });

//     // Capture the deployment event securely inside the audit ledger
//     await createAuditLog({
//       userId: req.user?._id || req.body.adminId,
//       module: "Donation Campaign",
//       action: "Campaign Created",
//       oldValue: "None",
//       newValue: JSON.stringify({ id: campaign._id, title: campaign.title, type: campaign.campaignType }),
//       ipAddress: req.ip,
//       userAgent: req.headers["user-agent"]
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Public donation campaign initialized and open for contributions",
//       campaign
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const getCampaigns = async (req, res) => {
//   try {
//     const campaigns = await DonationCampaign.find().sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: campaigns.length,
//       campaigns
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const closeCampaign = async (req, res) => {
//   try {
//     const campaign = await DonationCampaign.findByIdAndUpdate(
//       req.params.id,
//       { status: "CLOSED" },
//       { new: true }
//     );

//     if (!campaign) {
//       return res.status(404).json({ success: false, message: "Donation campaign profile not found" });
//     }

//     // Write close history tracking mapping details
//     await createAuditLog({
//       userId: req.user?._id,
//       module: "Donation Campaign",
//       action: "Campaign Closed",
//       oldValue: "OPEN",
//       newValue: "CLOSED",
//       ipAddress: req.ip,
//       userAgent: req.headers["user-agent"]
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Donation campaign successfully closed. Submissions are now locked.",
//       campaign
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const reopenCampaign = async (req, res) => {
//   try {
//     const campaign = await DonationCampaign.findByIdAndUpdate(
//       req.params.id,
//       { status: "OPEN" },
//       { new: true }
//     );

//     if (!campaign) {
//       return res.status(404).json({ success: false, message: "Donation campaign profile not found" });
//     }

//     // Write tracking log
//     await createAuditLog({
//       userId: req.user?._id,
//       module: "Donation Campaign",
//       action: "Campaign Reopened",
//       oldValue: "CLOSED",
//       newValue: "OPEN",
//       ipAddress: req.ip,
//       userAgent: req.headers["user-agent"]
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Donation campaign successfully reopened for public member deposits.",
//       campaign
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// module.exports = {
//   createCampaign,
//   getCampaigns,
//   closeCampaign,
//   reopenCampaign
// };
const mongoose = require("mongoose");
const { createAuditLog } = require("./auditLogController"); 

// Safe model loader guard to prevent OverwriteModelError crashes on Render boot
let DonationCampaign;
try {
  DonationCampaign = mongoose.model("DonationCampaign");
} catch {
  DonationCampaign = require("../models/DonationCampaign");
}

const createCampaign = async (req, res) => { 
  try { 
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
      
      // FIXED ENUM ALIGNMENT: Injects "Welfare Support" which perfectly matches your strict schema list
      category: (category && category.trim()) ? category.trim() : "Welfare Support",
      
      campaignType: campaignType || "General",
      endDate: endDate || null,
      status: "OPEN", 
      amountRaised: 0 
    }); 

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
    const campaigns = await DonationCampaign.find().sort({ createdAt: -1 }); 
    return res.status(200).json({ success: true, count: campaigns.length, campaigns }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const closeCampaign = async (req, res) => { 
  try { 
    const campaign = await DonationCampaign.findByIdAndUpdate( 
      req.params.id, 
      { status: "CLOSED" }, 
      { new: true } 
    ); 
    if (!campaign) { 
      return res.status(404).json({ success: false, message: "Donation campaign profile not found" }); 
    } 
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
    const campaign = await DonationCampaign.findByIdAndUpdate( 
      req.params.id, 
      { status: "OPEN" }, 
      { new: true } 
    ); 
    if (!campaign) { 
      return res.status(404).json({ success: false, message: "Donation campaign profile not found" }); 
    } 
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
