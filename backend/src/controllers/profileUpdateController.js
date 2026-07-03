const Member = require("../models/Member");
const ProfileUpdateRequest = require("../models/ProfileUpdateRequest");
const Notification = require("../models/Notification");
const { createAuditLog } = require("./auditLogController");

const requestProfileUpdate = async (req, res) => {
  try {
    const { memberId, fieldName, newValue } = req.body;
    const authenticatedMemberId = req.user?.userId || req.user?._id || memberId;

    const member = await Member.findById(authenticatedMemberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member profile document not found" });
    }

    // Isolate old database property value states cleanly
    let oldValue = member[fieldName];
    
    // Convert complex objects/arrays to text cleanly to prevent schema type validation bloat
    const serializedOldValue = typeof oldValue === "object" ? JSON.stringify(oldValue) : String(oldValue);
    const serializedNewValue = typeof newValue === "object" ? JSON.stringify(newValue) : String(newValue);

    const request = await ProfileUpdateRequest.create({
      memberId: authenticatedMemberId,
      fieldName,
      oldValue: serializedOldValue,
      newValue: serializedNewValue,
      status: "Pending"
    });

    await createAuditLog({
      userId: req.user?._id || authenticatedMemberId,
      module: "Profile Update",
      action: "Profile Update Requested",
      oldValue: serializedOldValue,
      newValue: serializedNewValue,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({
      success: true,
      message: "Profile modification change request submitted and is awaiting administrator verification approval.",
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllProfileUpdates = async (req, res) => {
  try {
    const requests = await ProfileUpdateRequest.find()
      .populate("memberId", "firstName surname email username membershipNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const approveProfileUpdate = async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Update request file not found" });
    }

    // 1. TRANSACTION PROTECTION LOCK (Fixes double-click data corruption bug)
    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Action denied: This profile request has already been processed and marked as ${request.status}`
      });
    }

    const member = await Member.findById(request.memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Associated member file not found" });
    }

    // 2. SAFE TYPE CONVERSION FILTER LAYER (Parses complex array/object fields)
    let parsedValue = request.newValue;
    if (typeof request.newValue === "string") {
      try {
        // Attempt parsing in case the new data is a serialized array/object string block
        if (request.newValue.startsWith("{") || request.newValue.startsWith("[")) {
          parsedValue = JSON.parse(request.newValue);
        }
      } catch (e) {
        // Fall back to keeping it as a raw string if it is a standard text value
        parsedValue = request.newValue;
      }
    }

    // Commit change data mutations directly to target schema properties safely
    member[request.fieldName] = parsedValue;
    await member.save();

    // Finalize tracking parameters on the logging document wrapper
    request.status = "Approved";
    request.reviewedAt = new Date();
    request.reviewedBy = req.user?._id;
    await request.save();

    // Notify the member's profile dashboard feed
    await Notification.create({
      memberId: member._id,
      title: "Profile Update Approved",
      message: `Your requested update regarding '${request.fieldName}' has been verified and approved.`,
      type: "ProfileApproval"
    });

    await createAuditLog({
      userId: req.user?._id,
      module: "Profile Update",
      action: "Profile Update Approved",
      oldValue: request.oldValue,
      newValue: request.newValue,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Profile information modifications successfully deployed live."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const rejectProfileUpdate = async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Update request file not found" });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({ success: false, message: `This request was already finalized as ${request.status}` });
    }

    request.status = "Rejected";
    request.adminRemark = req.body.adminRemark || "Information verification failed.";
    request.reviewedAt = new Date();
    request.reviewedBy = req.user?._id;
    await request.save();

    await Notification.create({
      memberId: request.memberId,
      title: "Profile Update Rejected",
      message: `Your requested profile update for '${request.fieldName}' was rejected. Reason: ${request.adminRemark}`,
      type: "ProfileRejection"
    });

    await createAuditLog({
      userId: req.user?._id,
      module: "Profile Update",
      action: "Profile Update Rejected",
      oldValue: request.oldValue,
      newValue: request.newValue,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Profile modification change request marked as Rejected successfully."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestProfileUpdate,
  getAllProfileUpdates,
  approveProfileUpdate,
  rejectProfileUpdate
};
