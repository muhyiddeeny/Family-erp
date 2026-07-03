const Member = require("../models/Member");
const House = require("../models/House");
const InvestmentProject = require("../models/InvestmentProject");
const InvestmentApplication = require("../models/InvestmentApplication");
const Donation = require("../models/Donation");
const EmploymentApplication = require("../models/EmploymentApplication");

const globalSearch = async (req, res) => {
  try {
    const search = req.query.q || "";

    // If search term is empty, return an empty payload matrix directly without stressing MongoDB
    if (!search.trim()) {
      return res.status(200).json({
        success: true,
        members: [], houses: [], projects: [], investments: [], donations: [], employment: []
      });
    }

    const regex = new RegExp(search, "i");

    // 1. Query Members match profiles directly
    const members = await Member.find({
      $or: [
        { firstName: regex },
        { surname: regex },
        { email: regex }
      ]
    }).limit(20); // Add a limit cap for blazing fast response speeds

    // 2. Query Houses match name definitions
    const houses = await House.find({ houseName: regex }).limit(20);

    // 3. Query Investment Campaigns match name definitions
    const projects = await InvestmentProject.find({ projectName: regex }).limit(20);

    /*
    |--------------------------------------------------------------------------
    | POPULATED RECORD TARGET FILTERS (Fixes the full-table scan bloat bug)
    |--------------------------------------------------------------------------
    | We grab the matching member IDs we found above, and use the Mongoose '$in' operator
    | to fetch only the explicit transactions or requests belonging to those matching members.
    */
    const matchingMemberIds = members.map(m => m._id);

    // 4. Filter Investment Applications by member match or arrangement details
    const investments = await InvestmentApplication.find({
      $or: [
        { memberId: { $in: matchingMemberIds } },
        { participationType: regex }
      ]
    })
      .populate("memberId", "firstName surname email")
      .limit(20);

    // 5. Filter Donation applications by member match or campaign tracking details
    const donations = await Donation.find({
      $or: [
        { memberId: { $in: matchingMemberIds } },
        { status: regex }
      ]
    })
      .populate("memberId", "firstName surname email")
      .limit(20);

    // 6. Filter Employment Applications by member match or status tags
    const employment = await EmploymentApplication.find({
      $or: [
        { memberId: { $in: matchingMemberIds } },
        { status: regex }
      ]
    })
      .populate("memberId", "firstName surname email")
      .limit(20);

    return res.status(200).json({
      success: true,
      members,
      houses,
      projects,
      investments,
      donations,
      employment
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  globalSearch
};
