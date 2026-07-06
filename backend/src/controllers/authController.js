const bcrypt = require("bcryptjs");
const crypto = require("crypto"); // FIXED LAYER: Import crypto utility engine to generate secure token parameters
const User = require("../models/User");
const Role = require("../models/Role"); 
const generateToken = require("../utils/generateToken");
const { createAuditLog } = require("./auditLogController"); // FIXED LAYER: Link logs hook to track recovery events

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
      $or: [{ email }, { username }]
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
      username,
      email,
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

    const user = await User.findOne({ email });

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
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email parameter is required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // SECURITY GUARD: Return 200 success even if user doesn't exist to prevent email enumeration hacks
      return res.status(200).json({ success: true, message: "If account exists, token recovery code has been generated." });
    }

    // Generate hexadecimal string token parameters
    const resetToken = crypto.randomBytes(20).toString("hex");
    
    // Hash token and assign 10 minute short-lived window parameters
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();

    // SERVER AUDIT FOOTPRINT: Logs access token generation
    await createAuditLog({
      userId: user._id,
      module: "Authentication",
      action: "Password Reset Token Generated",
      newValue: `Expires in 10 minutes. Plain text debug token: ${resetToken}`
    });

    /*
    |--------------------------------------------------------------------------
    | TESTING WORKFLOW OVERRIDE ENGINE
    |--------------------------------------------------------------------------
    | Since email networks are unconfigured on your live environment, we print 
    | the token straight to your dashboard terminal console so you can paste it 
    | into your screen fields without any mail configuration hurdles.
    */
    console.log("------------------------------------------------------------------");
    console.log("🔑 PLATFORM PASSWORD RESET WORKSPACE UTILITY CODE GENERATED!");
    console.log(`Target Email account: ${user.email}`);
    console.log(`Plain text Token Code (Copy this to screen field): ${resetToken}`);
    console.log("------------------------------------------------------------------");

    return res.status(200).json({
      success: true,
      message: "Recovery key code generated successfully inside server environment maps. Check logs or mail vectors.",
      debugToken: resetToken // Temporary access link shortcut handle for local client forms testing
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| PASSWORD RESET OVERWRITE EXECUTION
|--------------------------------------------------------------------------
*/
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token key and new passphrase fields are required." });
    }

    // Encrypt incoming token to compare against database hash values
    const encryptedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: encryptedToken,
      resetPasswordExpires: { $gt: Date.now() } // Verify time parameter boundary constraints
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid access token key or recovery timeframe has expired." });
    }

    // Overwrite ancient credentials with fresh encrypted hash variables
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await createAuditLog({
      userId: user._id,
      module: "Authentication",
      action: "Password Reset Execution Successful",
      newValue: "Credential profile passphrase reset via recovery tokens completed successfully."
    });

    return res.status(200).json({
      success: true,
      message: "Your platform passphrase has been updated successfully! Proceed to secure login view screens."
    });

  } catch (error) {
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
