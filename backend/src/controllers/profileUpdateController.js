const Member = require("../models/Member");
const ProfileUpdateRequest = require("../models/ProfileUpdateRequest");
const Notification = require("../models/Notification");
const { createAuditLog } = require("./auditLogController");

// Only these fields can be changed through a profile update request.
const ALLOWED_FIELDS = [
  "maritalStatus",
  "spouseUsername",
  "numberOfChildren",
  "degree",
  "institutionName",
  "courseOfStudy",
  "occupationCategory",
  "occupationDescription",
  "residentialAddress"
];

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const safeAudit = async (data) => {
  try {
    await createAuditLog(data);
  } catch (auditError) {
    console.error("Audit log error:", auditError.message);
  }
};

// Finds the Member profile that belongs to the logged-in user account.
const findMemberForUser = async (user) => {
  if (!user) return null;
  let member = null;
  if (user.memberId) member = await Member.findById(user.memberId);
  if (!member && user.username) member = await Member.findOne({ username: user.username });
  if (!member && user.email) member = await Member.findOne({ email: user.email });
  return member;
};

const requestProfileUpdate = async (req, res) => {
  try {
    const member = await findMemberForUser(req.user);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member profile document not found" });
    }

    // Accepts { requestedChanges: { field: value, ... } } or { fieldName, newValue }
    let changes = {};
    if (req.body.requestedChanges && typeof req.body.requestedChanges === "object") {
      changes = { ...req.body.requestedChanges };
    } else if (req.body.fieldName) {
      changes[req.body.fieldName] = req.body.newValue;
    }

    // Ignore empty values (empty means "no change")
    const entries = Object.entries(changes).filter(
      ([, value]) => value !== undefined && value !== null && String(value).trim() !== ""
    );

    const blockedField = entries.find(([field]) => !ALLOWED_FIELDS.includes(field));
    if (blockedField) {
      return res.status(400).json({
        success: false,
        message: `The field '${blockedField[0]}' cannot be changed through a profile update.`
      });
    }

    const cleaned = {};
    for (const [field, value] of entries) cleaned[field] = String(value).trim();

    // Spouse username validation
    if (cleaned.spouseUsername) {
      const effectiveMaritalStatus = cleaned.maritalStatus || member.maritalStatus;
      if (effectiveMaritalStatus !== "Married") {
        return res.status(400).json({
          success: false,
          message: "To add a partner, please also set Marital Status to 'Married'."
        });
      }

      const spouse = await Member.findOne({
        username: new RegExp(`^${escapeRegex(cleaned.spouseUsername)}$`, "i")
      });

      if (!spouse) {
        return res.status(400).json({
          success: false,
          message: `No family member was found with the username '${cleaned.spouseUsername}'. Please check the spelling.`
        });
      }

      if (String(spouse._id) === String(member._id)) {
        return res.status(400).json({
          success: false,
          message: "You cannot add your own username as your partner."
        });
      }

      cleaned.spouseUsername = spouse.username; // store the exact username
    }

    // Skip values that are the same as the current profile
    const changedEntries = Object.entries(cleaned).filter(
      ([field, value]) => String(member[field] ?? "") !== value
    );

    if (changedEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes detected. Fill in at least one field with a new value."
      });
    }

    const createdRequests = [];
    for (const [field, value] of changedEntries) {
      const oldValue = String(member[field] ?? "");

      const request = await ProfileUpdateRequest.create({
        memberId: member._id,
        fieldName: field,
        oldValue,
        newValue: value,
        changedBy: req.user?._id || null,
        status: "Pending"
      });
      createdRequests.push(request);

      await safeAudit({
        userId: req.user?._id || member._id,
        module: "Profile Update",
        action: "Profile Update Requested",
        oldValue,
        newValue: value,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
    }

    return res.status(201).json({
      success: true,
      message: "Profile modification change request submitted and is awaiting administrator verification approval.",
      requests: createdRequests
    });
  } catch (error) {
    console.error("requestProfileUpdate error:", error);
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
    console.error("getAllProfileUpdates error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const approveProfileUpdate = async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Update request file not found" });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Action denied: This profile request has already been processed and marked as ${request.status}`
      });
    }

    if (!ALLOWED_FIELDS.includes(request.fieldName)) {
      return res.status(400).json({
        success: false,
        message: `The field '${request.fieldName}' is not allowed to be changed through profile updates.`
      });
    }

    const member = await Member.findById(request.memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Associated member file not found" });
    }

    let parsedValue = request.newValue;
    if (typeof request.newValue === "string") {
      try {
        if (request.newValue.startsWith("{") || request.newValue.startsWith("[")) {
          parsedValue = JSON.parse(request.newValue);
        }
      } catch (e) {
        parsedValue = request.newValue;
      }
    }

    member[request.fieldName] = parsedValue;

    // If the member is no longer married, remove the partner link
    if (request.fieldName === "maritalStatus" && parsedValue !== "Married") {
      member.spouseUsername = "";
    }

    await member.save();

    request.status = "Approved";
    request.reviewedAt = new Date();
    request.reviewedBy = req.user?._id;
    await request.save();

    await Notification.create({
      memberId: member._id,
      title: "Profile Update Approved",
      message: `Your requested update regarding '${request.fieldName}' has been verified and approved.`,
      type: "ProfileApproval"
    });

    await safeAudit({
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
    console.error("approveProfileUpdate error:", error);
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

    const adminRemark = req.body.adminRemark || "Information verification failed.";

    request.status = "Rejected";
    request.adminRemark = adminRemark;
    request.reviewedAt = new Date();
    request.reviewedBy = req.user?._id;
    await request.save();

    await Notification.create({
      memberId: request.memberId,
      title: "Profile Update Rejected",
      message: `Your requested profile update for '${request.fieldName}' was rejected. Reason: ${adminRemark}`,
      type: "ProfileRejection"
    });

    await safeAudit({
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
    console.error("rejectProfileUpdate error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestProfileUpdate,
  getAllProfileUpdates,
  approveProfileUpdate,
  rejectProfileUpdate
};
