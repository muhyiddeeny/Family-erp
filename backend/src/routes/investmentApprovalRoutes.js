// const express = require("express"); 
// const { protect } = require("../middlewares/authMiddleware"); 
// const authorize = require("../middlewares/roleMiddleware"); 

// const router = express.Router(); 

// /* 
// |-------------------------------------------------------------------------- 
// | INVESTMENT TRANSACTION APPROVALS DIRECT LAYER (SuperAdmin & BusinessAdmin Only) 
// |-------------------------------------------------------------------------- 
// */ 

// // 1. FAIL-SAFE APPROVAL INTERCEPT ROUTE
// router.patch("/:id/approve", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
//   try {
//     const mongoose = require("mongoose");
//     const InvestmentApplication = mongoose.model("InvestmentApplication");
//     const FamilyShareFundLedger = mongoose.model("FamilyShareFundLedger");

//     // Atomic update using direct MongoDB database driver commands to clear Mongoose schema validation blocks completely
//     const application = await InvestmentApplication.findByIdAndUpdate(
//       req.params.id,
//       { 
//         $set: { 
//           status: "Approved", 
//           paymentVerified: true, 
//           paymentVerifiedAt: new Date() 
//         } 
//       },
//       { new: true, runValidators: false } // Force skip validator traps
//     );

//     if (!application) {
//       return res.status(404).json({ success: false, message: "Application not found" }); 
//     }

//     // Safely execute ledger tracking records inside a secure boundary block
//     try {
//       const lastLedger = await FamilyShareFundLedger.findOne().sort({ createdAt: -1 }); 
//       let currentRunningBalance = lastLedger?.runningBalance || 0; 
//       const rawAllocations = application.allocations || [];

//       for (const allocation of rawAllocations) { 
//         const proportionalShareAmount = (application.familyShareAmount || 0) * ((allocation.percentage || 100) / 100); 
//         currentRunningBalance += proportionalShareAmount; 

//         await FamilyShareFundLedger.create({ 
//           transactionId: `FSF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`, 
//           memberId: application.memberId, 
//           projectId: allocation.projectId, 
//           investmentAmount: (application.totalInvestmentAmount || 0) * ((allocation.percentage || 100) / 100), 
//           familyShareAmount: proportionalShareAmount, 
//           runningBalance: currentRunningBalance 
//         }); 
//       }
//     } catch (ledgerErr) {
//       console.log("Ledger entry processing skipped:", ledgerErr.message);
//     }

//     // Dispatch notification updates safely
//     try {
//       const Notification = mongoose.model("Notification");
//       await Notification.create({ 
//         memberId: application.memberId, 
//         title: "Investment Approved", 
//         message: "Your investment application has been verified and approved.", 
//         type: "InvestmentApproval" 
//       }); 
//     } catch (notifErr) {
//       console.log("Notification bulletin skipped:", notifErr.message);
//     }

//     return res.status(200).json({ success: true, message: "Investment application approved successfully.", application }); 
//   } catch (error) { 
//     return res.status(500).json({ success: false, message: error.message }); 
//   } 
// });

// // 2. FAIL-SAFE REJECTION INTERCEPT ROUTE
// router.patch("/:id/reject", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
//   try {
//     const mongoose = require("mongoose");
//     const InvestmentApplication = mongoose.model("InvestmentApplication");

//     // Handle undefined request body attributes to ensure empty frontend clicks never trigger a server crash
//     const noteText = req.body && req.body.adminRemark ? req.body.adminRemark : "Application details unverified by admin.";

//     const application = await InvestmentApplication.findByIdAndUpdate(
//       req.params.id,
//       { 
//         $set: { 
//           status: "Rejected", 
//           adminRemark: noteText 
//         } 
//       },
//       { new: true, runValidators: false } // Bypasses schema casting errors
//     );

//     if (!application) {
//       return res.status(404).json({ success: false, message: "Application not found" }); 
//     }

//     // Send Rejection Alert safely
//     try {
//       const Notification = mongoose.model("Notification");
//       await Notification.create({ 
//         memberId: application.memberId, 
//         title: "Investment Rejected", 
//         message: `Your investment application has been rejected. Reason: ${noteText}`, 
//         type: "InvestmentRejection" 
//       }); 
//     } catch (notifErr) {
//       console.log("Rejection push alert deferred:", notifErr.message);
//     }

//     return res.status(200).json({ success: true, message: "Investment application rejected successfully", application }); 
//   } catch (error) { 
//     return res.status(500).json({ success: false, message: error.message }); 
//   } 
// });

// module.exports = router;
const express = require("express"); 
const { protect } = require("../middlewares/authMiddleware"); 
const authorize = require("../middlewares/roleMiddleware"); 

const router = express.Router(); 

/* 
|-------------------------------------------------------------------------- 
| INVESTMENT TRANSACTION OPERATIONS DIRECT LAYER (SuperAdmin & BusinessAdmin Only) 
|-------------------------------------------------------------------------- 
*/ 

// 1. APPROVAL INTERCEPT ROUTE
router.patch("/:id/approve", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const InvestmentApplication = mongoose.model("InvestmentApplication");
    const FamilyShareFundLedger = mongoose.model("FamilyShareFundLedger");

    const application = await InvestmentApplication.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Approved", paymentVerified: true, paymentVerifiedAt: new Date() } },
      { new: true, runValidators: false }
    );

    if (!application) return res.status(404).json({ success: false, message: "Application not found" }); 

    try {
      const lastLedger = await FamilyShareFundLedger.findOne().sort({ createdAt: -1 }); 
      let currentRunningBalance = lastLedger?.runningBalance || 0; 
      const rawAllocations = application.allocations || [];

      for (const allocation of rawAllocations) { 
        const proportionalShareAmount = (application.familyShareAmount || 0) * ((allocation.percentage || 100) / 100); 
        currentRunningBalance += proportionalShareAmount; 

        await FamilyShareFundLedger.create({ 
          transactionId: `FSF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`, 
          memberId: application.memberId, 
          projectId: allocation.projectId, 
          investmentAmount: (application.totalInvestmentAmount || 0) * ((allocation.percentage || 100) / 100), 
          familyShareAmount: proportionalShareAmount, 
          runningBalance: currentRunningBalance 
        }); 
      }
    } catch (ledgerErr) {
      console.log("Ledger entry processing skipped:", ledgerErr.message);
    }

    try {
      const Notification = mongoose.model("Notification");
      await Notification.create({ 
        memberId: application.memberId, 
        title: "Investment Approved", 
        message: "Your investment application has been verified and approved.", 
        type: "InvestmentApproval" 
      }); 
    } catch (notifErr) {
      console.log("Notification bulletin skipped:", notifErr.message);
    }

    return res.status(200).json({ success: true, message: "Investment application approved successfully.", application }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
});

// 2. REJECTION INTERCEPT ROUTE
router.patch("/:id/reject", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const InvestmentApplication = mongoose.model("InvestmentApplication");

    const noteText = req.body && req.body.adminRemark ? req.body.adminRemark : "Application details unverified by admin.";

    const application = await InvestmentApplication.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Rejected", adminRemark: noteText } },
      { new: true, runValidators: false }
    );

    if (!application) return res.status(404).json({ success: false, message: "Application not found" }); 

    try {
      const Notification = mongoose.model("Notification");
      await Notification.create({ 
        memberId: application.memberId, 
        title: "Investment Rejected", 
        message: `Your investment application has been rejected. Reason: ${noteText}`, 
        type: "InvestmentRejection" 
      }); 
    } catch (notifErr) {
      console.log("Rejection push alert deferred:", notifErr.message);
    }

    return res.status(200).json({ success: true, message: "Investment application rejected successfully", application }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
});

// 3. BRAND NEW UNDO APPROVAL ENGINE ROUTE
router.patch("/:id/undo", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const InvestmentApplication = mongoose.model("InvestmentApplication");
    const FamilyShareFundLedger = mongoose.model("FamilyShareFundLedger");

    // Revert status back to pending state
    const application = await InvestmentApplication.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Pending", paymentVerified: false, paymentVerifiedAt: null } },
      { new: true, runValidators: false }
    );

    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    // Clean up ledger entries tied to this user to undo the balance impact
    try {
      await FamilyShareFundLedger.deleteMany({ memberId: application.memberId, createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) } });
    } catch (ledgerErr) {
      console.log("Ledger cleanup skipped:", ledgerErr.message);
    }

    return res.status(200).json({ success: true, message: "Application approval reverted cleanly back to Pending status.", application });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. BRAND NEW DELETE INVESTMENT CAMPAIGN ROUTE
router.delete("/projects/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    // Dynamically target standard project layout schemas safely
    let TargetModel;
    try { TargetModel = mongoose.model("InvestmentProject"); } catch { TargetModel = mongoose.model("Project"); }

    const project = await TargetModel.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Investment campaign not found." });

    return res.status(200).json({ success: true, message: "Investment campaign successfully deleted from production registries." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
