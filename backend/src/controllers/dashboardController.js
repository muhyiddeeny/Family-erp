const Member = require("../models/Member");
const House = require("../models/House");
const InvestmentApplication = require("../models/InvestmentApplication");
const Donation = require("../models/Donation");
const EmploymentApplication = require("../models/EmploymentApplication");
const FamilyShareFundLedger = require("../models/FamilyShareFundLedger");

const getMemberDashboard = async (req, res) => {
  try {
    const memberId = req.params.memberId || req.user?._id; // Multi-routing fallback key reference

    const member = await Member.findById(memberId).select("-passwordHash");
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member profile file not found"
      });
    }

    // 1. Fetch House and explicitly isolate the link to plug the global members list registry data leak
    const rawHouse = await House.findById(member.houseId);
    let houseSummary = null;
    let whatsappCommunityLink = "";

    if (rawHouse) {
      whatsappCommunityLink = rawHouse.whatsappCommunityLink || ""; // Extracted safely
      houseSummary = {
        _id: rawHouse._id,
        houseName: rawHouse.houseName,
        description: rawHouse.description
        // We purposefully omit 'members' array maps here to protect user group identities!
      };
    }

    // 2. Fetch standard personal submittals history data logs concurrently
    const [investments, donations, employmentApplications] = await Promise.all([
      InvestmentApplication.find({ memberId }).populate("projectId", "projectName status").sort({ createdAt: -1 }),
      Donation.find({ memberId }).populate("campaignId", "title status").sort({ createdAt: -1 }),
      EmploymentApplication.find({ memberId }).populate("projectId", "projectName status").sort({ createdAt: -1 })
    ]);

    /*
    |--------------------------------------------------------------------------
    | TARGETED BALANCES COLLECTION AGGREGATION POOL (Blazing Fast Calculations)
    |--------------------------------------------------------------------------
    | We calculate the exact financial ledger matrix positions inside the 
    | database layer using matching filters. This extracts only the pre-computed totals.
    */
    const [shareFinancials] = await FamilyShareFundLedger.aggregate([
      { $match: { memberId: member._id } },
      {
        $group: {
          _id: null,
          totalFamilyShare: { $sum: { $ifNull: ["$familyShareAmount", 0] } },
          totalProfit: { $sum: { $ifNull: ["$profitAllocation", 0] } },
          totalLoss: { $sum: { $ifNull: ["$lossAllocation", 0] } }
        }
      }
    ]) || [{}];

    return res.status(200).json({
      success: true,
      profile: member,
      house: houseSummary, // Returns sanitized context frame without nested user leak risks
      whatsappCommunityLink,
      investmentPortfolio: investments,
      donationHistory: donations,
      employmentApplications,
      familyShareSummary: {
        totalFamilyShare: shareFinancials.totalFamilyShare || 0,
        totalProfit: shareFinancials.totalProfit || 0,
        totalLoss: shareFinancials.totalLoss || 0
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getMemberDashboard
};
