const InvestmentApplication = require("../models/InvestmentApplication");
const Notification = require("../models/Notification");
const FamilyShareFundLedger = require("../models/FamilyShareFundLedger"); // Import the ledger
const { createAuditLog } = require("./auditLogController");

const approveInvestmentApplication = async (req, res) => {
  try {
    const application = await InvestmentApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Safety: Check if it's already approved to avoid double ledger insertions
    if (application.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "This application has already been approved"
      });
    }

    // 1. Update Application Status Flags
    application.status = "Approved";
    application.paymentVerified = true;
    application.paymentVerifiedAt = new Date();
    await application.save();

    // 2. FIXED LAYER: Safe, Sequential Ledger Accounting Commitment
    // Fetch the absolute latest ledger state to compute the correct running balance pool
    const lastLedger = await FamilyShareFundLedger.findOne().sort({ createdAt: -1 });
    let currentRunningBalance = lastLedger?.runningBalance || 0;

    // Consecutively write split distribution blocks for each allocated project
    for (const allocation of application.allocations) {
      // Calculate the specific portion of the 10% fund matching this project's allocation percentage
      const proportionalShareAmount = application.familyShareAmount * (allocation.percentage / 100);
      
      // Build the running balance layers sequentially to avoid state overwrites
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

    // 4. Record Immutable Security System Audit Log
    await createAuditLog({
      userId: req.user?._id,
      module: "Investment",
      action: "Investment Approved",
      oldValue: "Pending",
      newValue: "Approved",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Investment application approved and committed to share ledger.",
      application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const rejectInvestmentApplication = async (req, res) => {
  try {
    const application = await InvestmentApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    application.status = "Rejected";
    application.adminRemark = req.body.adminRemark || "";
    await application.save();

    // Send Rejection Alert
    await Notification.create({
      memberId: application.memberId,
      title: "Investment Rejected",
      message: `Your investment application has been rejected. Reason: ${application.adminRemark}`,
      type: "InvestmentRejection"
    });

    // Audit Log
    await createAuditLog({
      userId: req.user?._id,
      module: "Investment",
      action: "Investment Rejected",
      oldValue: "Pending",
      newValue: "Rejected",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Investment application rejected successfully",
      application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  approveInvestmentApplication,
  rejectInvestmentApplication
};
