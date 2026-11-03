const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer"); 
const User = require("../models/User");
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
    const { username, email, password, role } = req.body;

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

    const targetRoleName = role || "Member";
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
| FORGOT PASSWORD GENERATOR PIPELINE
|--------------------------------------------------------------------------
*/
const hashCode = (code) => crypto.createHash("sha256").update(String(code).trim().toLowerCase()).digest("hex");

const buildMailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Test mode only: returns the code in the API response. Never enable this in real use.
const debugResetEnabled = () => process.env.ALLOW_DEBUG_RESET_TOKEN === "true";

const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email parameter is required." });
    }

    const transporter = buildMailTransporter();
    if (!transporter && !debugResetEnabled()) {
      console.error("Password reset unavailable: EMAIL_USER / EMAIL_PASSWORD are not set.");
      return res.status(503).json({
        success: false,
        message: "The password reset email service is not set up yet. Please contact the administrator."
      });
    }

    const genericResponse = {
      success: true,
      message: "If an account exists for that email, a reset code has been sent."
    };

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const resetCode = crypto.randomBytes(4).toString("hex"); // 8-character code

    user.resetPasswordToken = hashCode(resetCode);
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    let emailSent = false;
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Family Platform" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "Your password reset code",
          text:
            `Hello ${user.username},\n\n` +
            `Your password reset code is: ${resetCode}\n\n` +
            `It is valid for 10 minutes. If you did not request this, you can ignore this email.`
        });
        emailSent = true;
      } catch (mailError) {
        console.error("Password reset email failed:", mailError.message);
      }
    }

    if (!emailSent && !debugResetEnabled()) {
      return res.status(502).json({
        success: false,
        message: "We could not send the reset email right now. Please try again later."
      });
    }

    await createAuditLog({
      userId: user._id,
      module: "Authentication",
      action: "Password Reset Code Generated",
      newValue: "Reset code generated. Expires in 10 minutes."
    });

    const response = { ...genericResponse };
    if (debugResetEnabled()) {
      response.debugToken = resetCode;
      console.log(`[DEBUG RESET] ${user.email} -> ${resetCode}`);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| PASSWORD RESET EXECUTION
|--------------------------------------------------------------------------
*/
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, reset code and new password are required." });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: "Your new password must be at least 6 characters long." });
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
      resetPasswordToken: hashCode(token),
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid reset code, or the code has expired." });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await createAuditLog({
      userId: user._id,
      module: "Authentication",
      action: "Password Reset Execution Successful",
      newValue: "Password was reset using an emailed recovery code."
    });

    return res.status(200).json({
      success: true,
      message: "Your password has been updated successfully. You can now log in."
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
};
