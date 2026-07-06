const Member = require("../models/Member");
const User = require("../models/User"); // SYSTEM CONTROL LAYER: Import your root user credential model

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
| ADMIN MANAGEMENT PATHWAYS (SuperAdmin Management Privileges Console)
|--------------------------------------------------------------------------
*/

// 1. GET ALL CREATED SUB-ADMINS (Excludes common Members and the root SuperAdmin)
const getAllSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({
      role: { $in: ["HouseAdmin", "BusinessAdmin", "MembershipAdmin", "DonationAdmin", "Admin"] }
    })
    .select("-passwordHash") // Privacy protection layout
    .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: subAdmins.length,
      admins: subAdmins
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 2. UPDATE EXISTING SUB-ADMIN PROFILE CRITERIA OR SYSTEM ROLE
const updateSubAdmin = async (req, res) => {
  try {
    const { username, email, role } = req.body;

    // Strict parameter alignment checking configuration
    const updatedAdmin = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { username, email, role } },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Target sub-admin profile record not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sub-admin profile modified successfully.",
      admin: updatedAdmin
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 3. COMPLETE SUB-ADMIN SYSTEM ACCOUNT PURGE
const deleteSubAdmin = async (req, res) => {
  try {
    const deletedAdmin = await User.findByIdAndDelete(req.params.id);

    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Target sub-admin credentials document not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sub-admin profile completely purged from system directory registry."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  getAllSubAdmins,
  updateSubAdmin,
  deleteSubAdmin
};
