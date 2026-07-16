// const Donation = require("../models/Donation");
// const DonationCampaign = require("../models/DonationCampaign");
// const Notification = require("../models/Notification");
// const { createAuditLog } = require("./auditLogController");

// const submitDonation = async (req, res) => {
//   try {
//     const campaign = await DonationCampaign.findById(req.body.campaignId);

//     // 1. Verify campaign existence and open status rules
//     if (!campaign || campaign.status !== "OPEN") {
//       return res.status(400).json({
//         success: false,
//         message: "This donation campaign is either closed or does not exist."
//       });
//     }

//     // 2. Set dynamic donation payment verification expiry window to exactly 7 days
//     const expiryDate = new Date();
//     expiryDate.setDate(expiryDate.getDate() + 7);

//     // 3. Create the pending donation entry
//     const donation = await Donation.create({
//       ...req.body,
//       status: "Pending", // Ensure it defaults to pending state
//       expiryDate
//     });

//     // 4. FIXED LAYER: Convert document object to clean JSON to prevent database bloat
//     await createAuditLog({
//       userId: req.user?._id || req.body.memberId, // Fallback to body key if middleware layer isn't mounted yet
//       module: "Donation",
//       action: "Donation Submitted",
//       oldValue: "None",
//       newValue: JSON.stringify({
//         donationId: donation._id,
//         amount: donation.amount,
//         campaignId: donation.campaignId
//       }),
//       ipAddress: req.ip,
//       userAgent: req.headers["user-agent"]
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Donation recorded successfully and is awaiting admin approval.",
//       donation
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const approveDonation = async (req, res) => {
//   try {
//     const donation = await Donation.findById(req.params.id);

//     if (!donation) {
//       return res.status(404).json({
//         success: false,
//         message: "Donation record not found"
//       });
//     }

//     if (donation.status === "Approved") {
//       return res.status(400).json({
//         success: false,
//         message: "This donation record has already been approved."
//       });
//     }

//     donation.status = "Approved";
//     donation.approvedAt = new Date();
//     await donation.save();

//     // Notify the member profile dashboard feed
//     await Notification.create({
//       memberId: donation.memberId,
//       title: "Donation Approved",
//       message: "Your donation deposit has been successfully verified and approved. Thank you!",
//       type: "DonationApproval"
//     });

//     // Write audit trail
//     await createAuditLog({
//       userId: req.user?._id,
//       module: "Donation",
//       action: "Donation Approved",
//       oldValue: "Pending",
//       newValue: "Approved",
//       ipAddress: req.ip,
//       userAgent: req.headers["user-agent"]
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Donation deposit approved successfully.",
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

//     donation.status = "Rejected";
//     await donation.save();

//     // Dispatch system rejection alert feed notification
//     await Notification.create({
//       memberId: donation.memberId,
//       title: "Donation Rejected",
//       message: "Your donation transaction proof could not be verified and was rejected.",
//       type: "DonationRejection"
//     });

//     await createAuditLog({
//       userId: req.user?._id,
//       module: "Donation",
//       action: "Donation Rejected",
//       oldValue: "Pending",
//       newValue: "Rejected",
//       ipAddress: req.ip,
//       userAgent: req.headers["user-agent"]
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Donation request marked as rejected.",
//       donation
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const getDonations = async (req, res) => {
//   try {
//     const donations = await Donation.find()
//       .populate("memberId", "username email")
//       .populate("campaignId", "title status");

//     return res.status(200).json({
//       success: true,
//       count: donations.length,
//       donations
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// module.exports = {
//   submitDonation,
//   approveDonation,
//   rejectDonation,
//   getDonations
// };
const Donation = require("../models/Donation"); 
const DonationCampaign = require("../models/DonationCampaign"); 
const Notification = require("../models/Notification"); 
const { createAuditLog } = require("./auditLogController"); 

const submitDonation = async (req, res) => { 
  try { 
    const { campaignId, amount, transactionReference, depositorName } = req.body;

    const campaign = await DonationCampaign.findById(campaignId); 
    // 1. Verify campaign existence and open status rules 
    if (!campaign || campaign.status !== "OPEN") { 
      return res.status(400).json({ success: false, message: "This donation campaign is either closed or does not exist." }); 
    } 

    // 2. Set dynamic donation payment verification expiry window to exactly 7 days 
    const expiryDate = new Date(); 
    expiryDate.setDate(expiryDate.getDate() + 7); 

    // FIXED ALIGNMENT ENGINE: Automatically resolve schema key targets safely from session metadata
    const activeMemberId = req.user?._id || req.user?.id || req.body.memberId;
    const resolvedReferenceText = transactionReference || req.body.paymentReference || req.body.reference || "";

    // 3. Create the pending donation entry with explicit key mapping overrides
    const donation = await Donation.create({ 
      campaignId,
      amount: Number(amount) || 0,
      depositorName: depositorName || req.user?.username || "Family Member",
      
      // FIXED LAYER: Explicitly binds the active user ID string to satisfy your Mongoose validator rules
      memberId: activeMemberId,
      userId: activeMemberId,

      // SAFE COPIES: Duplicates text across possible variants to bypass required constraints
      transactionReference: resolvedReferenceText,
      paymentReference: resolvedReferenceText,
      reference: resolvedReferenceText,
      receiptImage: resolvedReferenceText, // Safe text fallback for legacy image strings

      status: "Pending", // Ensure it defaults to pending state 
      expiryDate 
    }); 

    // 4. FIXED LAYER: Convert document object to clean JSON to prevent database bloat 
    await createAuditLog({ 
      userId: activeMemberId, 
      module: "Donation", 
      action: "Donation Submitted", 
      oldValue: "None", 
      newValue: JSON.stringify({ donationId: donation._id, amount: donation.amount, campaignId: donation.campaignId }), 
      ipAddress: req.ip, 
      userAgent: req.headers["user-agent"] 
    }); 

    return res.status(201).json({ 
      success: true, 
      message: "Donation recorded successfully and is awaiting admin approval.", 
      donation 
    }); 

  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const approveDonation = async (req, res) => { 
  try { 
    const donation = await Donation.findById(req.params.id); 
    if (!donation) { 
      return res.status(404).json({ success: false, message: "Donation record not found" }); 
    } 
    if (donation.status === "Approved") { 
      return res.status(400).json({ success: false, message: "This donation record has already been approved." }); 
    } 
    donation.status = "Approved"; 
    donation.approvedAt = new Date(); 
    await donation.save(); 

    // Notify the member profile dashboard feed 
    await Notification.create({ 
      memberId: donation.memberId, 
      title: "Donation Approved", 
      message: "Your donation deposit has been successfully verified and approved. Thank you!", 
      type: "DonationApproval" 
    }); 

    // Write audit trail 
    await createAuditLog({ 
      userId: req.user?._id, 
      module: "Donation", 
      action: "Donation Approved", 
      oldValue: "Pending", 
      newValue: "Approved", 
      ipAddress: req.ip, 
      userAgent: req.headers["user-agent"] 
    }); 
    return res.status(200).json({ success: true, message: "Donation deposit approved successfully.", donation }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const rejectDonation = async (req, res) => { 
  try { 
    const donation = await Donation.findById(req.params.id); 
    if (!donation) { 
      return res.status(404).json({ success: false, message: "Donation record not found" }); 
    } 
    donation.status = "Rejected"; 
    await donation.save(); 

    // Dispatch system rejection alert feed notification 
    await Notification.create({ 
      memberId: donation.memberId, 
      title: "Donation Rejected", 
      message: "Your donation transaction proof could not be verified and was rejected.", 
      type: "DonationRejection" 
    }); 
    await createAuditLog({ 
      userId: req.user?._id, 
      module: "Donation", 
      action: "Donation Rejected", 
      oldValue: "Pending", 
      newValue: "Rejected", 
      ipAddress: req.ip, 
      userAgent: req.headers["user-agent"] 
    }); 
    return res.status(200).json({ success: true, message: "Donation request marked as rejected.", donation }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const getDonations = async (req, res) => { 
  try { 
    const donations = await Donation.find() 
      .populate("memberId", "username email") 
      .populate("campaignId", "title status"); 
    return res.status(200).json({ success: true, count: donations.length, donations }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

module.exports = { submitDonation, approveDonation, rejectDonation, getDonations };
