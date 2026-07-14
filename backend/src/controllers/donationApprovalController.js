const Donation = require("../models/Donation");
const DonationCampaign = require("../models/DonationCampaign");
const Notification = require("../models/Notification");
const { createAuditLog } = require("./auditLogController");

const approveDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation record not found"
      });
    }

    // 1. DYNAMIC FLAGGING SAFETY CHECK (Fixes campaign balance overwrite loop bug)
    if (donation.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Action denied: This donation has already been verified and approved"
      });
    }

    donation.status = "Approved";
    donation.paymentVerified = true;
    donation.paymentVerifiedAt = new Date();
    await donation.save();

    // 2. Increment target platform campaign fund accumulator atomically
    await DonationCampaign.findByIdAndUpdate(
      donation.campaignId,
      { $inc: { amountRaised: donation.amount } }
    );

    // 3. Dispatch system notification alert directly to member dashboard feed
    await Notification.create({
      memberId: donation.memberId,
      title: "Donation Deposit Approved",
      message: `Your donation contribution has been verified and credited. Thank you for your support!`,
      type: "DonationApproval"
    });

    // 4. Log the administrative operation to your secure system audit ledger trail
    await createAuditLog({
      userId: req.user?._id,
      module: "Donation Approval",
      action: "Donation Approved",
      oldValue: "Pending",
      newValue: JSON.stringify({ donationId: donation._id, amount: donation.amount }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Donation verified successfully and metrics updated",
      donation
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const rejectDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation record not found"
      });
    }

    if (donation.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "This donation record has already been rejected."
      });
    }

    donation.status = "Rejected";
    donation.adminRemark = req.body.adminRemark || "Unverified payment transaction proof.";
    await donation.save();

    // Dispatch profile rejection notice feed alert
    await Notification.create({
      memberId: donation.memberId,
      title: "Donation Proof Rejected",
      message: `Your donation submission could not be verified. Reason: ${donation.adminRemark}`,
      type: "DonationRejection"
    });

    // Write transaction audit trace mapping block
    await createAuditLog({
      userId: req.user?._id,
      module: "Donation Approval",
      action: "Donation Rejected",
      oldValue: "Pending",
      newValue: "Rejected",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Donation request successfully rejected",
      donation
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  approveDonation,
  rejectDonation
};
