const InvestmentApplication = require("../models/InvestmentApplication");
const InvestmentExpirySetting = require("../models/InvestmentExpirySetting");
const Notification = require("../models/Notification"); // <-- Import your Notification model

const processExpiredInvestments = async () => {
  try {
    // 1. Fetch the duration rules saved by your Investment Admin
    const setting = await InvestmentExpirySetting.findOne();

    // If the admin hasn't created a configuration yet, fallback to a safe default of 7 days
    const allowedDays = setting ? setting.expiryDays : 7;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - allowedDays);

    // 2. Query for all unverified files matching the expiration criteria
    const expiredApplications = await InvestmentApplication.find({
      status: "Pending",
      paymentVerified: false,
      createdAt: { $lte: expiryDate }
    });

    if (expiredApplications.length === 0) {
      return;
    }

    console.log(`[EXPIRY SERVICE]: Found ${expiredApplications.length} unverified requests exceeding the ${allowedDays}-day admin window.`);

    // 3. Loop through them sequentially to update statuses and alert the affected members
    for (const app of expiredApplications) {
      app.status = "Expired";
      app.adminRemark = `System Timeout: Payment was not verified within the mandatory ${allowedDays}-day admin window.`;
      await app.save();

      // Broadcast an automatic alert directly to the member's profile feed dashboard
      await Notification.create({
        memberId: app.memberId,
        title: "Investment Request Expired",
        message: `Your investment application request has expired because payment verification was not finalized within the ${allowedDays}-day window.`,
        type: "InvestmentExpiry"
      });
    }

    console.log("Investment expiry check completed and member notifications dispatched.");
  } catch (error) {
    console.error("Critical error inside investment expiry service layer:", error.message);
  }
};

module.exports = processExpiredInvestments;
