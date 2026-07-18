// const express = require("express");
// const {
//   approveInvestmentApplication,
//   rejectInvestmentApplication
// } = require("../controllers/investmentApprovalController");
// const { protect } = require("../middlewares/authMiddleware"); // Import your session verification middleware
// const authorize = require("../middlewares/roleMiddleware"); // Import your role checking middleware

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | INVESTMENT TRANSACTION APPROVALS (SuperAdmin & BusinessAdmin Only)
// |--------------------------------------------------------------------------
// | Running payment verification checks, calculating share fund deductions,
// | and committing records to the immutable ledger requires strict admin clearance.
// */
// router.patch("/:id/approve", protect, authorize("SuperAdmin", "BusinessAdmin"), approveInvestmentApplication);
// router.patch("/:id/reject", protect, authorize("SuperAdmin", "BusinessAdmin"), rejectInvestmentApplication);

// module.exports = router;
const InvestmentApplication = require("../models/InvestmentApplication"); 
const Notification = require("../models/Notification"); 
const FamilyShareFundLedger = require("../models/FamilyShareFundLedger"); 
const { createAuditLog } = require("./auditLogController"); 

const approveInvestmentApplication = async (req, res) => { 
  try { 
    const application = await InvestmentApplication.findById(req.params.id); 
    if (!application) { 
      return res.status(404).json({ success: false, message: "Application not found" }); 
    } 

    if (application.status === "Approved") { 
      return res.status(400).json({ success: false, message: "This application has already been approved" }); 
    } 

    // 1. Update Application Status Flags 
    application.status = "Approved"; 
    application.paymentVerified = true; 
    application.paymentVerifiedAt = new Date(); 
    await application.save(); 

    // 2. Safe, Sequential Ledger Accounting Commitment 
    const lastLedger = await FamilyShareFundLedger.findOne().sort({ createdAt: -1 }); 
    let currentRunningBalance = lastLedger?.runningBalance || 0; 

    // Consecutively write split distribution blocks for each allocated project 
    for (const allocation of application.allocations) { 
      const proportionalShareAmount = application.familyShareAmount * (allocation.percentage / 100); 
      currentRunningBalance += proportionalShareAmount; 

      await FamilyShareFundLedger.create({ 
        transactionId: `FSF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`, 
        memberId: application.memberId, 
        projectId: allocation.projectId, 
        investmentAmount: application.totalInvestmentAmount * (allocation.percentage / 100), 
        familyShareAmount: proportionalShareAmount, 
        runningBalance: currentRunningBalance 
      }); 
    } 

    // 3. Dispatch Notification Bulletin 
    await Notification.create({ 
      memberId: application.memberId, 
      title: "Investment Approved", 
      message: "Your investment application has been verified and approved.", 
      type: "InvestmentApproval" 
    }); 

    // 4. FIXED SAFETY LAYER: Protect the core approval workflow from audit log crashes
    try {
      await createAuditLog({ 
        userId: req.user?._id || application.memberId, 
        module: "Investment", 
        action: "Investment Approved", 
        oldValue: "Pending", 
        newValue: "Approved", 
        ipAddress: req.ip || "127.0.0.1", 
        userAgent: req.headers["user-agent"] || "System Admin Frontend" 
      }); 
    } catch (auditErr) {
      console.log("⚠️ Audit logging deferred to prevent 500 error:", auditErr.message);
    }

    return res.status(200).json({ success: true, message: "Investment application approved and committed to share ledger.", application }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const rejectInvestmentApplication = async (req, res) => { 
  try { 
    const application = await InvestmentApplication.findById(req.params.id); 
    if (!application) { 
      return res.status(404).json({ success: false, message: "Application not found" }); 
    } 

    // Safely assign default text parameters if the frontend passes an empty request body
    const textRejectionReason = (req.body && req.body.adminRemark) ? req.body.adminRemark : "Application unverified by admin.";

    // 1. Update Application Status Flags
    application.status = "Rejected"; 
    application.adminRemark = textRejectionReason; 
    await application.save(); 

    // 2. Send Rejection Alert 
    await Notification.create({ 
      memberId: application.memberId, 
      title: "Investment Rejected", 
      message: `Your investment application has been rejected. Reason: ${textRejectionReason}`, 
      type: "InvestmentRejection" 
    }); 

    // 3. FIXED SAFETY LAYER: Protect the core rejection workflow from audit log crashes
    try {
      await createAuditLog({ 
        userId: req.user?._id || application.memberId, 
        module: "Investment", 
        action: "Investment Rejected", 
        oldValue: "Pending", 
        newValue: "Rejected", 
        ipAddress: req.ip || "127.0.0.1", 
        userAgent: req.headers["user-agent"] || "System Admin Frontend" 
      }); 
    } catch (auditErr) {
      console.log("⚠️ Audit logging deferred to prevent 500 error:", auditErr.message);
    }

    return res.status(200).json({ success: true, message: "Investment application rejected successfully", application }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

module.exports = { approveInvestmentApplication, rejectInvestmentApplication };
