const express = require("express");
const User = require("../models/User");
const Member = require("../models/Member");
require("../models/House"); // makes sure the House model is registered for populate
const { getMemberDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

const ADMIN_ROLES = ["SuperAdmin", "MembershipAdmin", "BusinessAdmin", "DonationAdmin", "HouseAdmin"];

// Makes sure a saved WhatsApp link always opens correctly (adds https:// when missing)
const normalizeLink = (link) => {
  const text = String(link || "").trim();
  if (!text) return "";
  return /^https?:\/\//i.test(text) ? text : `https://${text.replace(/^\/+/, "")}`;
};

/*
|--------------------------------------------------------------------------
| MEMBER SUMMARY (used by the member dashboard)
|--------------------------------------------------------------------------
*/
router.get("/member-summary", protect, async (req, res) => {
  try {
    const userProfile = await User.findById(req.user._id);
    if (!userProfile) {
      return res.status(404).json({ success: false, message: "User security profile not found inside ledger maps." });
    }

    const email = String(userProfile.email || "").toLowerCase().trim();
    const housePopulate = {
      path: "houseId",
      select: "houseName name description whatsappCommunityLink",
      options: { strictPopulate: false }
    };

    // Find the member profile by email first, then by username
    let memberDetails = await Member.findOne({ email }).select("-passwordHash").populate(housePopulate);
    if (!memberDetails && userProfile.username) {
      memberDetails = await Member.findOne({ username: userProfile.username }).select("-passwordHash").populate(housePopulate);
    }

    const userPayload = {
      id: userProfile._id,
      username: userProfile.username,
      email: userProfile.email,
      role: userProfile.role
    };

    if (!memberDetails) {
      // Admins without a member profile can still open User Mode (with empty personal data)
      if (ADMIN_ROLES.includes(userProfile.role)) {
        return res.status(200).json({
          success: true,
          user: userPayload,
          member: {},
          noMemberProfile: true
        });
      }
      return res.status(404).json({ success: false, message: "Member demographic records not found inside collections." });
    }

    const member = memberDetails.toObject();
    if (member.houseId && typeof member.houseId === "object") {
      member.houseId.whatsappCommunityLink = normalizeLink(member.houseId.whatsappCommunityLink);
    }

    return res.status(200).json({ success: true, user: userPayload, member });
  } catch (error) {
    console.error("member-summary error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/*
|--------------------------------------------------------------------------
| SECURE PERSONAL DASHBOARD ENDPOINT FEED
|--------------------------------------------------------------------------
*/
router.get("/member/:memberId", protect, getMemberDashboard);

module.exports = router;
