const InvestmentApplication = require("../models/InvestmentApplication");
const InvestmentRule = require("../models/InvestmentRule");

const submitApplication = async (req, res) => {
  try {
    const {
      memberId,
      totalInvestmentAmount,
      participationType,
      allocations
    } = req.body;

    // 1. Validate that allocations total exactly 100%
    const totalPercentage = allocations.reduce(
      (total, allocation) => total + allocation.percentage,
      0
    );

    if (totalPercentage !== 100) {
      return res.status(400).json({
        success: false,
        message: "Allocation percentages must equal 100%"
      });
    }

    // 2. Fetch the active investment rules metadata layer
    const activeRule = await InvestmentRule.findOne({ isActive: true })
      .sort({ version: -1 });

    if (!activeRule) {
      return res.status(400).json({
        success: false,
        message: "No active investment rule found"
      });
    }

    // 3. Dynamic 10% Forced Share Fund Calculations Math
    const familyShareAmount = totalInvestmentAmount * 0.1;
    const personalInvestmentAmount = totalInvestmentAmount - familyShareAmount;

    // 4. Commit the Core Master Portfolio Record (Set to default Pending status)
    const application = await InvestmentApplication.create({
      memberId,
      totalInvestmentAmount,
      familyShareAmount,
      personalInvestmentAmount,
      participationType,
      allocations,
      status: "Pending", // Forces status to stay pending until admin action
      acceptedRuleId: activeRule._id,
      acceptedRuleVersion: activeRule.version,
      acceptedAt: new Date()
    });

    // NOTE: Ledger loop was successfully removed from here to prevent double-insertions!

    return res.status(201).json({
      success: true,
      message: "Investment application submitted successfully and is awaiting payment verification",
      application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getApplications = async (req, res) => {
  try {
    const applications = await InvestmentApplication.find()
      .populate("memberId")
      .populate("acceptedRuleId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  submitApplication,
  getApplications
};
