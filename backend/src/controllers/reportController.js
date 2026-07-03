const Member = require("../models/Member");
const House = require("../models/House");
const InvestmentApplication = require("../models/InvestmentApplication");
const EmploymentApplication = require("../models/EmploymentApplication");
const Donation = require("../models/Donation");
const generatePDF = require("../utils/pdfGenerator");

const memberReport = async (req, res) => {
  try {
    const members = await Member.find().sort({ surname: 1 });
    return generatePDF("Members_Report", members, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: `PDF Generation Failed: ${error.message}` });
  }
};

const houseReport = async (req, res) => {
  try {
    const houses = await House.find().sort({ houseName: 1 });
    return generatePDF("Houses_Report", houses, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: `PDF Generation Failed: ${error.message}` });
  }
};

const investmentReport = async (req, res) => {
  try {
    // Populate member details to ensure names display cleanly inside report tables
    const investments = await InvestmentApplication.find()
      .populate("memberId", "firstName surname email")
      .sort({ createdAt: -1 });
    return generatePDF("Investments_Report", investments, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: `PDF Generation Failed: ${error.message}` });
  }
};

const employmentReport = async (req, res) => {
  try {
    const employment = await EmploymentApplication.find()
      .populate("memberId", "firstName surname email")
      .sort({ createdAt: -1 });
    return generatePDF("Employment_Report", employment, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: `PDF Generation Failed: ${error.message}` });
  }
};

const donationReport = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("memberId", "firstName surname email")
      .sort({ createdAt: -1 });
    return generatePDF("Donations_Report", donations, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: `PDF Generation Failed: ${error.message}` });
  }
};

const analyticsReport = async (req, res) => {
  try {
    // Parallel execution blocks save valuable roundtrip query timing intervals
    const [
      totalMembers,
      totalHouses,
      totalInvestments,
      totalEmployment,
      totalDonations
    ] = await Promise.all([
      Member.countDocuments(),
      House.countDocuments(),
      InvestmentApplication.countDocuments(),
      EmploymentApplication.countDocuments(),
      Donation.countDocuments()
    ]);

    const analytics = {
      totalMembers,
      totalHouses,
      totalInvestments,
      totalEmployment,
      totalDonations,
      generatedAt: new Date().toLocaleString()
    };

    return generatePDF("Analytics_Report", [analytics], res);
  } catch (error) {
    return res.status(500).json({ success: false, message: `PDF Generation Failed: ${error.message}` });
  }
};

module.exports = {
  memberReport,
  houseReport,
  investmentReport,
  employmentReport,
  donationReport,
  analyticsReport
};
