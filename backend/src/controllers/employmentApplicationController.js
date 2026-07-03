const EmploymentApplication = require("../models/EmploymentApplication");
const Notification = require("../models/Notification");
const { createAuditLog } = require("./auditLogController");

const submitApplication = async (req, res) => {
  try {
    const application = await EmploymentApplication.create({
      ...req.body,
      status: "Pending" // Force status to default to pending upon submission
    });

    // FIXED LAYER: Convert the document into a clean, targeted text snapshot to save space
    await createAuditLog({
      userId: req.user?._id || req.body.memberId,
      module: "Employment",
      action: "Application Submitted",
      oldValue: "None",
      newValue: JSON.stringify({
        applicationId: application._id,
        memberId: application.memberId,
        projectId: application.projectId
      }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({
      success: true,
      message: "Employment application logged successfully.",
      application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getApplications = async (req, res) => {
  try {
    const applications = await EmploymentApplication.find()
      .populate("memberId", "firstName surname email")
      .populate("projectId", "projectName status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const application = await EmploymentApplication.findById(req.params.id)
      .populate("memberId", "firstName surname email")
      .populate("projectId", "projectName status");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    return res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const approveApplication = async (req, res) => {
  try {
    const application = await EmploymentApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // SECURITY LAYER FIX: Stop processing immediately if already approved to prevent double logs
    if (application.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "This application has already been approved."
      });
    }

    application.status = "Approved";
    application.approvedAt = new Date();
    await application.save();

    await Notification.create({
      memberId: application.memberId,
      title: "Employment Application Approved",
      message: "Your application for family system operations employment has been approved.",
      type: "EmploymentApproval"
    });

    await createAuditLog({
      userId: req.user?._id,
      module: "Employment",
      action: "Application Approved",
      oldValue: "Pending",
      newValue: "Approved",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Application marked as Approved successfully.",
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
    application.rejectionReason = req.body.rejectionReason || "No explicit reason specified by admin.";
    await application.save();

    await Notification.create({
      memberId: application.memberId,
      title: "Employment Application Rejected",
      message: `Your employment application has been rejected. Reason: ${application.rejectionReason}`,
      type: "EmploymentRejection"
    });

    await createAuditLog({
      userId: req.user?._id,
      module: "Employment",
      action: "Application Rejected",
      oldValue: "Pending",
      newValue: "Rejected",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Application marked as Rejected.",
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
  submitApplication,
  getApplications,
  getApplicationById,
  approveApplication,
  rejectApplication
};
