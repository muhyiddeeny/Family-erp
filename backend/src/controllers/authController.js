const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Member = require("../models/Member");
const Role = require("../models/Role"); 
const generateToken = require("../utils/generateToken");
const { createAuditLog } = require("./auditLogController"); 

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.trim().toLowerCase() }, 
        { username: username.trim().toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const targetRoleName = "Member"; // public sign-up can never create admin accounts
    let roleDocument = await Role.findOne({ name: targetRoleName });

    if (!roleDocument) {
      roleDocument = await Role.create({
        name: targetRoleName,
        description: `Automated dynamic level assignment for ${targetRoleName} system operators.`
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: targetRoleName,
      roleId: roleDocument._id
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
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
| LOGIN
|--------------------------------------------------------------------------
*/
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // FIXED STRATEGY LAYER: Sanitizes variations in input text casing to find your records cleanly
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
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
| GET CURRENT USER
|--------------------------------------------------------------------------
*/
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      user
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
| PASSWORD MANAGEMENT
|--------------------------------------------------------------------------
*/
const PASSWORD_MIN_LENGTH = 8;

// Random 10-character password without look-alike characters (no 0/O, 1/l/I)
const generateTemporaryPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) password += chars[crypto.randomInt(chars.length)];
  return password;
};

const safeAudit = async (data) => {
  try {
    await createAuditLog(data);
  } catch (auditError) {
    console.error("Audit log error:", auditError.message);
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN RESETS A MEMBER'S PASSWORD (SuperAdmin / MembershipAdmin only)
|--------------------------------------------------------------------------
*/
const adminResetMemberPassword = async (req, res) => {
  try {
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: "memberId is required." });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found." });
    }

    let user = await User.findOne({ email: String(member.email || "").toLowerCase() });
    if (!user && member.username) {
      user = await User.findOne({ username: member.username });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "No login account was found for this member." });
    }

    // Only a SuperAdmin can reset the password of an administrator account
    if (user.role !== "Member" && req.user.role !== "SuperAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only a SuperAdmin can reset an administrator's password."
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await Member.updateOne({ _id: member._id }, { passwordHash });

    await safeAudit({
      userId: req.user._id,
      module: "Authentication",
      action: "Admin Password Reset",
      newValue: `Password reset for ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.set("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      message: "Temporary password generated.",
      temporaryPassword,
      member: {
        name: `${member.firstName || ""} ${member.surname || ""}`.trim(),
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("adminResetMemberPassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| LOGGED-IN USER CHANGES THEIR OWN PASSWORD
|--------------------------------------------------------------------------
*/
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required." });
    }

    if (String(newPassword).length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Your new password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
      });
    }

    if (String(newPassword) === String(currentPassword)) {
      return res.status(400).json({ success: false, message: "Your new password must be different from the current one." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Your current password is incorrect." });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.passwordHash = passwordHash;
    await user.save();

    await Member.updateOne({ email: user.email }, { passwordHash });

    await safeAudit({
      userId: user._id,
      module: "Authentication",
      action: "Password Changed",
      newValue: "User changed their own password.",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({ success: true, message: "Your password has been changed successfully." });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| SELF-SERVICE PASSWORD CHANGE (no login needed, current password required)
|--------------------------------------------------------------------------
*/
// Basic protection against password guessing: 8 wrong attempts per email locks this feature for 15 minutes
const failedAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 8;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

const isLockedOut = (key) => {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
};

const recordFailure = (key) => {
  if (failedAttempts.size > 5000) {
    for (const [k, v] of failedAttempts) {
      if (Date.now() > v.resetAt) failedAttempts.delete(k);
    }
  }
  const entry = failedAttempts.get(key);
  if (!entry || Date.now() > entry.resetAt) {
    failedAttempts.set(key, { count: 1, resetAt: Date.now() + LOCK_WINDOW_MS });
  } else {
    entry.count += 1;
  }
};

const LOCKED_MESSAGE = "Too many incorrect attempts. Please try again in 15 minutes.";
const WRONG_CREDENTIALS_MESSAGE = "The email or current password is incorrect.";

// Step 1: checks that the email + current password match
const verifyCurrentPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const currentPassword = String(req.body.currentPassword || "");

    if (!email || !currentPassword) {
      return res.status(400).json({ success: false, message: "Email and current password are required." });
    }

    if (isLockedOut(email)) {
      return res.status(429).json({ success: false, message: LOCKED_MESSAGE });
    }

    const user = await User.findOne({ email });
    const isMatch = user ? await bcrypt.compare(currentPassword, user.passwordHash) : false;

    if (!isMatch) {
      recordFailure(email);
      return res.status(400).json({ success: false, message: WRONG_CREDENTIALS_MESSAGE });
    }

    return res.status(200).json({ success: true, message: "Current password confirmed." });
  } catch (error) {
    console.error("verifyCurrentPassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Step 2: sets the new password (the current password is checked again for safety)
const changePasswordWithCurrent = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, current password and new password are required." });
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Your new password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ success: false, message: "Your new password must be different from the current one." });
    }

    if (isLockedOut(email)) {
      return res.status(429).json({ success: false, message: LOCKED_MESSAGE });
    }

    const user = await User.findOne({ email });
    const isMatch = user ? await bcrypt.compare(currentPassword, user.passwordHash) : false;

    if (!isMatch) {
      recordFailure(email);
      return res.status(400).json({ success: false, message: WRONG_CREDENTIALS_MESSAGE });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await Member.updateOne({ email: user.email }, { passwordHash });
    failedAttempts.delete(email);

    await safeAudit({
      userId: user._id,
      module: "Authentication",
      action: "Password Changed (Self-Service)",
      newValue: "User changed their own password using their current password.",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({ success: true, message: "Your password has been changed successfully. You can now log in." });
  } catch (error) {
    console.error("changePasswordWithCurrent error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  adminResetMemberPassword,
  changePassword,
  verifyCurrentPassword,
  changePasswordWithCurrent
};
