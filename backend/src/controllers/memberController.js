const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Member = require("../models/Member");
const User = require("../models/User");
const Role = require("../models/Role");
const { createAuditLog } = require("./auditLogController");

const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find()
      .select("-passwordHash")
      .populate("houseId", "houseName whatsappCommunityLink")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: members.length,
      members
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .select("-passwordHash")
      .populate("houseId", "houseName whatsappCommunityLink");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Family member profile document not found"
      });
    }

    return res.status(200).json({
      success: true,
      member
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
|--------------------------------------------------------------------------
| SUB-ADMIN MANAGEMENT (SuperAdmin only - enforced in memberRoutes.js)
|--------------------------------------------------------------------------
*/

// Roles a SuperAdmin can give out when creating or assigning a sub-admin
const SUB_ADMIN_ROLES = ["MembershipAdmin", "BusinessAdmin", "DonationAdmin", "HouseAdmin"];

// Roles that appear in the sub-admin directory ("Admin" is kept for older accounts)
const LISTED_ADMIN_ROLES = [...SUB_ADMIN_ROLES, "Admin"];

const PASSWORD_MIN_LENGTH = 8;

// Finds a role document by name, or creates it the first time it is needed
const getOrCreateRole = async (name) => {
  let role = await Role.findOne({ name });
  if (!role) {
    role = await Role.create({ name, description: `${name} system role.` });
  }
  return role;
};

const writeAudit = (req, action, oldValue, newValue) =>
  createAuditLog({
    userId: req.user?._id,
    module: "System Control",
    action,
    oldValue,
    newValue,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
  });

// Removes private fields before a user document is sent to the browser
const toSafeUser = (userDoc) => {
  const obj = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  delete obj.passwordHash;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

// Adds "hasMemberProfile" and "memberName" so the screen can tell registered members
// apart from accounts that the SuperAdmin created directly
const attachMemberInfo = async (users) => {
  const emails = users.map((u) => u.email);
  const members = await Member.find({ email: { $in: emails } }).select("email firstName surname");
  const byEmail = new Map(members.map((m) => [String(m.email).toLowerCase(), m]));

  return users.map((u) => {
    const member = byEmail.get(String(u.email).toLowerCase());
    return {
      ...toSafeUser(u),
      hasMemberProfile: Boolean(member),
      memberName: member ? `${member.firstName || ""} ${member.surname || ""}`.trim() : ""
    };
  });
};

// Loads a user and makes sure it really is a sub-admin (never the SuperAdmin, never a plain member)
const loadSubAdmin = async (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: "Invalid account id." });
    return null;
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ success: false, message: "Target sub-admin profile record not found." });
    return null;
  }

  if (!LISTED_ADMIN_ROLES.includes(user.role)) {
    res.status(400).json({ success: false, message: "This account is not a sub-admin." });
    return null;
  }

  return user;
};

// 1. LIST ALL CURRENT SUB-ADMINS
const getAllSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({ role: { $in: LISTED_ADMIN_ROLES } })
      .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 });

    const admins = await attachMemberInfo(subAdmins);

    return res.status(200).json({
      success: true,
      count: admins.length,
      admins
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. LIST EXISTING USERS WHO CAN BE MADE SUB-ADMIN (regular users only)
const getEligibleUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "Member" })
      .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
      .sort({ username: 1 });

    const eligible = await attachMemberInfo(users);

    return res.status(200).json({
      success: true,
      count: eligible.length,
      users: eligible
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. CREATE A BRAND NEW SUB-ADMIN ACCOUNT (no member registration needed)
const createSubAdmin = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "").trim();

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Username, email, password and role are required." });
    }

    if (!SUB_ADMIN_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid sub-admin role selected." });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `The password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
      });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A user with this email or username already exists. Use \"Assign From Existing Users\" instead."
      });
    }

    const roleDoc = await getOrCreateRole(role);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      passwordHash,
      role,
      roleId: roleDoc._id
    });

    await writeAudit(req, "Sub-Admin Created", "None", { userId: user._id, email: user.email, role });

    return res.status(201).json({
      success: true,
      message: `Sub-admin account created for ${user.username}.`,
      admin: { ...toSafeUser(user), hasMemberProfile: false, memberName: "" }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. MAKE AN EXISTING USER A SUB-ADMIN
const assignSubAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const role = String(req.body.role || "").trim();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Please select a valid user." });
    }

    if (!SUB_ADMIN_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid sub-admin role selected." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "SuperAdmin") {
      return res.status(400).json({ success: false, message: "This user is already the SuperAdmin." });
    }

    if (user.role !== "Member") {
      return res.status(400).json({
        success: false,
        message: `This user is already a ${user.role}. Use Modify in the directory to change the role.`
      });
    }

    const roleDoc = await getOrCreateRole(role);
    user.role = role;
    user.roleId = roleDoc._id;
    await user.save();

    await writeAudit(req, "Sub-Admin Assigned", { userId: user._id, role: "Member" }, { userId: user._id, role });

    const [admin] = await attachMemberInfo([user]);

    return res.status(200).json({
      success: true,
      message: `${user.username} is now a ${role}.`,
      admin
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. MODIFY A SUB-ADMIN (username, email, role)
const updateSubAdmin = async (req, res) => {
  try {
    const user = await loadSubAdmin(req.params.id, res);
    if (!user) return;

    const oldEmail = user.email;
    const oldUsername = user.username;
    const oldRole = user.role;

    const newUsername = req.body.username !== undefined ? String(req.body.username).trim() : user.username;
    const newEmail = req.body.email !== undefined ? String(req.body.email).trim().toLowerCase() : user.email;
    const newRole = req.body.role !== undefined ? String(req.body.role).trim() : user.role;

    if (!newUsername || !newEmail) {
      return res.status(400).json({ success: false, message: "Username and email cannot be empty." });
    }

    if (!LISTED_ADMIN_ROLES.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. To remove admin access, use Revoke instead."
      });
    }

    const clash = await User.findOne({
      _id: { $ne: user._id },
      $or: [{ email: newEmail }, { username: newUsername }]
    });
    if (clash) {
      return res.status(400).json({ success: false, message: "Another account already uses this email or username." });
    }

    // If this person is also a registered member, keep their member profile in step
    const linkedMember = await Member.findOne({ email: oldEmail });
    if (linkedMember && newEmail !== oldEmail) {
      const memberClash = await Member.findOne({ email: newEmail, _id: { $ne: linkedMember._id } });
      if (memberClash) {
        return res.status(400).json({ success: false, message: "Another member profile already uses this email." });
      }
    }

    user.username = newUsername;
    user.email = newEmail;
    if (newRole !== oldRole) {
      const roleDoc = await getOrCreateRole(newRole);
      user.role = newRole;
      user.roleId = roleDoc._id;
    }
    await user.save();

    if (linkedMember) {
      const memberChanges = {};
      if (newEmail !== oldEmail) memberChanges.email = newEmail;
      if (newUsername !== oldUsername && linkedMember.username === oldUsername) memberChanges.username = newUsername;
      if (Object.keys(memberChanges).length > 0) {
        await Member.updateOne({ _id: linkedMember._id }, { $set: memberChanges });
      }
    }

    await writeAudit(
      req,
      "Sub-Admin Modified",
      { userId: user._id, username: oldUsername, email: oldEmail, role: oldRole },
      { userId: user._id, username: newUsername, email: newEmail, role: newRole }
    );

    const [admin] = await attachMemberInfo([user]);

    return res.status(200).json({
      success: true,
      message: "Sub-admin profile modified successfully.",
      admin
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. SUPERADMIN SETS A NEW PASSWORD FOR A SUB-ADMIN
const changeSubAdminPassword = async (req, res) => {
  try {
    const newPassword = String(req.body.newPassword || "");

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `The new password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
      });
    }

    const user = await loadSubAdmin(req.params.id, res);
    if (!user) return;

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Registered members keep the same password on their member profile
    await Member.updateOne({ email: user.email }, { $set: { passwordHash } });

    await writeAudit(req, "Sub-Admin Password Changed", "None", `SuperAdmin changed the password of ${user.email}`);

    return res.status(200).json({
      success: true,
      message: `Password changed for ${user.username}. Share the new password with them securely.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. REVOKE ADMINSHIP: the account is kept and becomes a regular user
const revokeSubAdmin = async (req, res) => {
  try {
    const user = await loadSubAdmin(req.params.id, res);
    if (!user) return;

    const previousRole = user.role;
    const memberRoleDoc = await getOrCreateRole("Member");

    user.role = "Member";
    user.roleId = memberRoleDoc._id;
    await user.save();

    await writeAudit(req, "Sub-Admin Revoked", { userId: user._id, role: previousRole }, { userId: user._id, role: "Member" });

    return res.status(200).json({
      success: true,
      message: `${user.username} is no longer a sub-admin and is now a regular user.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. SUPERADMIN STEPS DOWN AND HANDS THE ROLE TO ANOTHER EXISTING USER
const transferSuperAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentPassword = String(req.body.currentPassword || "");

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Please select the user who will become SuperAdmin." });
    }

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: "Enter your own password to confirm this action." });
    }

    // req.user has no password hash, so load the full account
    const currentSuperAdmin = await User.findById(req.user._id);
    if (!currentSuperAdmin) {
      return res.status(404).json({ success: false, message: "Your account could not be found." });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, currentSuperAdmin.passwordHash);
    if (!passwordMatches) {
      return res.status(400).json({ success: false, message: "Your password is incorrect." });
    }

    if (String(currentSuperAdmin._id) === String(userId)) {
      return res.status(400).json({ success: false, message: "Choose a different user to take over the SuperAdmin role." });
    }

    const newSuperAdmin = await User.findById(userId);
    if (!newSuperAdmin) {
      return res.status(404).json({ success: false, message: "The selected user was not found." });
    }

    if (newSuperAdmin.role === "SuperAdmin") {
      return res.status(400).json({ success: false, message: "The selected user is already a SuperAdmin." });
    }

    const superAdminRoleDoc = await getOrCreateRole("SuperAdmin");
    const memberRoleDoc = await getOrCreateRole("Member");
    const previousRoleOfNewSuperAdmin = newSuperAdmin.role;

    // Promote first, then step down, so the system is never left without a SuperAdmin
    newSuperAdmin.role = "SuperAdmin";
    newSuperAdmin.roleId = superAdminRoleDoc._id;
    await newSuperAdmin.save();

    currentSuperAdmin.role = "Member";
    currentSuperAdmin.roleId = memberRoleDoc._id;
    await currentSuperAdmin.save();

    await writeAudit(
      req,
      "SuperAdmin Role Transferred",
      { superAdmin: currentSuperAdmin.email, newSuperAdminPreviousRole: previousRoleOfNewSuperAdmin },
      { superAdmin: newSuperAdmin.email, formerSuperAdminNowRole: "Member" }
    );

    return res.status(200).json({
      success: true,
      message: `${newSuperAdmin.username} is now the SuperAdmin. You have stepped down and are now a regular user.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  getAllSubAdmins,
  getEligibleUsers,
  createSubAdmin,
  assignSubAdmin,
  updateSubAdmin,
  changeSubAdminPassword,
  revokeSubAdmin,
  transferSuperAdmin
};
