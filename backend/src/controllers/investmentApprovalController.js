// const InvestmentApplication = require("../models/InvestmentApplication"); 
// const Notification = require("../models/Notification"); 
// const FamilyShareFundLedger = require("../models/FamilyShareFundLedger"); 
// const { createAuditLog } = require("./auditLogController"); 

// const approveInvestmentApplication = async (req, res) => { 
//   try { 
//     const application = await InvestmentApplication.findById(req.params.id); 
//     if (!application) { 
//       return res.status(404).json({ success: false, message: "Application not found" }); 
//     } 

//     // FIXED IDEMPOTENCY BYPASS: If the record has already been committed as approved,
//     // safely return a 200 Success status array back to the frontend instead of throwing a rigid 400 error blocker.
//     if (application.status === "Approved") { 
//       return res.status(200).json({ 
//         success: true, 
//         message: "This investment allocation transaction has already been verified and logged into your ledger banks.", 
//         application 
//       }); 
//     } 

//     // 1. Update Application Status Flags 
//     application.status = "Approved"; 
//     application.paymentVerified = true; 
//     application.paymentVerifiedAt = new Date(); 
//     await application.save(); 

//     // 2. FIXED LAYER: Safe, Sequential Ledger Accounting Commitment 
//     const lastLedger = await FamilyShareFundLedger.findOne().sort({ createdAt: -1 }); 
//     let currentRunningBalance = lastLedger?.runningBalance || 0; 

//     // Consecutively write split distribution blocks for each allocated project 
//     for (const allocation of application.allocations) { 
//       const proportionalShareAmount = application.familyShareAmount * (allocation.percentage / 100); 
//       currentRunningBalance += proportionalShareAmount; 

//       await FamilyShareFundLedger.create({ 
//         transactionId: `FSF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`, 
//         memberId: application.memberId, 
//         projectId: allocation.projectId, 
//         investmentAmount: application.totalInvestmentAmount * (allocation.percentage / 100), 
//         familyShareAmount: proportionalShareAmount, 
//         runningBalance: currentRunningBalance 
//       }); 
//     } 

//     // 3. Dispatch Notification Bulletin 
//     await Notification.create({ 
//       memberId: application.memberId, 
//       title: "Investment Approved", 
//       message: "Your investment application has been verified and approved.", 
//       type: "InvestmentApproval" 
//     }); 

//     // 4. Record Immutable Security System Audit Log 
//     await createAuditLog({ 
//       userId: req.user?._id, 
//       module: "Investment", 
//       action: "Investment Approved", 
//       oldValue: "Pending", 
//       newValue: "Approved", 
//       ipAddress: req.ip, 
//       userAgent: req.headers["user-agent"] 
//     }); 

//     return res.status(200).json({ success: true, message: "Investment application approved and committed to share ledger.", application }); 
//   } catch (error) { 
//     return res.status(500).json({ success: false, message: error.message }); 
//   } 
// }; 

// const rejectInvestmentApplication = async (req, res) => { 
//   try { 
//     const application = await InvestmentApplication.findById(req.params.id); 
//     if (!application) { 
//       return res.status(404).json({ success: false, message: "Application not found" }); 
//     } 

//     // Capture fallback string description tags safely from whatever text parameter variants the frontend form passes
//     const textRejectionReason = req.body.adminRemark || req.body.adminRemark || req.body.remark || req.body.reason || "Unverified payment validation proof.";

//     // 1. Update status parameters to flag item state
//     application.status = "Rejected"; 
    
//     // FIXED METADATA PROPERTY KEY: Maps explicitly to your database schema attribute variable string 
//     // to protect your document writes from triggering strict 500 validation pointer crashes.
//     application.adminRemark = textRejectionReason; 
    
//     await application.save(); 

//     // 2. Send Rejection Alert 
//     await Notification.create({ 
//       memberId: application.memberId, 
//       title: "Investment Rejected", 
//       message: `Your investment application has been rejected. Reason: ${textRejectionReason}`, 
//       type: "InvestmentRejection" 
//     }); 

//     // 3. Audit Log 
//     await createAuditLog({ 
//       userId: req.user?._id, 
//       module: "Investment", 
//       action: "Investment Rejected", 
//       oldValue: "Pending", 
//       newValue: "Rejected", 
//       ipAddress: req.ip, 
//       userAgent: req.headers["user-agent"] 
//     }); 

//     return res.status(200).json({ success: true, message: "Investment application rejected successfully", application }); 
//   } catch (error) { 
//     return res.status(500).json({ success: false, message: error.message }); 
//   } 
// }; 

// module.exports = { approveInvestmentApplication, rejectInvestmentApplication };
const InvestmentApplication = require("../models/InvestmentApplication"); 
const Notification = require("../models/Notification"); 
const FamilyShareFundLedger = require("../models/FamilyShareFundLedger"); 
const { createAuditLog } = require("./auditLogController"); 

const approveInvestmentApplication = async (req, res) => { 
  try { 
    const application = await InvestmentApplication.findById(req.params.id); 
    if (!application) { 
      return res.status(404).json({ success: false, message: "Application not found" }); 
    } 
    if (application.status === "Approved") { 
      return res.status(400).json({ success: false, message: "This application has already been approved" }); 
    } 
    application.status = "Approved"; 
    application.paymentVerified = true; 
    application.paymentVerifiedAt = new Date(); 
    await application.save(); 

    const lastLedger = await FamilyShareFundLedger.findOne().sort({ createdAt: -1 }); 
    let currentRunningBalance = lastLedger?.runningBalance || 0; 

    for (const allocation of application.allocations) { 
      const proportionalShareAmount = application.familyShareAmount * (allocation.percentage / 100); 
      currentRunningBalance += proportionalShareAmount; 
      await FamilyShareFundLedger.create({ 
        transactionId: `FSF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`, 
        memberId: application.memberId, 
        projectId: allocation.projectId, 
        investmentAmount: application.totalInvestmentAmount * (allocation.percentage / 100), 
        familyShareAmount: proportionalShareAmount, 
        runningBalance: currentRunningBalance 
      }); 
    } 

    await Notification.create({ 
      memberId: application.memberId, 
      title: "Investment Approved", 
      message: "Your investment application has been verified and approved.", 
      type: "InvestmentApproval" 
    }); 

    await createAuditLog({ 
      userId: req.user?._id, 
      module: "Investment", 
      action: "Investment Approved", 
      oldValue: "Pending", 
      newValue: "Approved", 
      ipAddress: req.ip, 
      userAgent: req.headers["user-agent"] 
    }); 
    return res.status(200).json({ success: true, message: "Investment application approved and committed to share ledger.", application }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const rejectInvestmentApplication = async (req, res) => { 
  try { 
    const application = await InvestmentApplication.findById(req.params.id); 
    if (!application) { 
      return res.status(404).json({ success: false, message: "Application not found" }); 
    } 
    application.status = "Rejected"; 
    application.adminRemark = req.body.adminRemark || ""; 
    await application.save(); 

    await Notification.create({ 
      memberId: application.memberId, 
      title: "Investment Rejected", 
      message: `Your investment application has been rejected. Reason: ${application.adminRemark}`, 
      type: "InvestmentRejection" 
    }); 

    await createAuditLog({ 
      userId: req.user?._id, 
      module: "Investment", 
      action: "Investment Rejected", 
      oldValue: "Pending", 
      newValue: "Rejected", 
      ipAddress: req.ip, 
      userAgent: req.headers["user-agent"] 
    }); 
    return res.status(200).json({ success: true, message: "Investment application rejected successfully", application }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

module.exports = { approveInvestmentApplication, rejectInvestmentApplication };
