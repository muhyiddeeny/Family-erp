const EmploymentApplication = require("../models/EmploymentApplication");
const Notification = require("../models/Notification");
const { createAuditLog } = require("./auditLogController");

const approveApplication = async (req, res) => {
  try {
    const application = await EmploymentApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // 1. DYNAMIC FLAGGING SAFETY CHECK (Fixes double-log leak)
    if (application.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Action denied: This application has already been approved"
      });
    }

    application.status = "Approved";
    application.reviewedAt = new Date();
    application.reviewedBy = req.user?._id || null;
    await application.save();

    // 2. Dispatch profile notification alert directly to member dashboard feed
    await Notification.create({
      memberId: application.memberId,
      title: "Employment Application Approved",
      message: "Your application for family system operations employment has been approved.",
      type: "EmploymentApproval"
    });

    // 3. Log the administrative operation to your secure system audit ledger trail
    await createAuditLog({
      userId: req.user?._id,
      module: "Employment Review",
      action: "Application Approved",
      oldValue: "Pending",
      newValue: "Approved",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Employment application approved successfully",
      application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const rejectApplication = async (req, res) => {
  try {
    const application = await EmploymentApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    if (application.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "This application has already been rejected."
      });
    }

    application.status = "Rejected";
    application.adminRemark = req.body.adminRemark || "No explicit reason specified by admin.";
    application.reviewedAt = new Date();
    application.reviewedBy = req.user?._id || null;
    await application.save();

    // Send Rejection Alert
    await Notification.create({
      memberId: application.memberId,
      title: "Employment Application Rejected",
      message: `Your employment application has been rejected. Reason: ${application.adminRemark}`,
      type: "EmploymentRejection"
    });

    // Audit Log
    await createAuditLog({
      userId: req.user?._id,
      module: "Employment Review",
      action: "Application Rejected",
      oldValue: "Pending",
      newValue: "Rejected",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Employment application successfully rejected",
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
  approveApplication,
  rejectApplication
};
