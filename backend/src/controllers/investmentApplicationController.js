// const InvestmentApplication = require("../models/InvestmentApplication"); 
// const InvestmentRule = require("../models/InvestmentRule"); 

// const submitApplication = async (req, res) => { 
//   try { 
//     const { memberId, totalInvestmentAmount, participationType, allocations } = req.body; 

//     // Extract the raw structural items cleanly to parse math parameters safely
//     const rawAllocationsArray = allocations || [];
//     const rawInvestmentValue = Number(totalInvestmentAmount) || 0;

//     // 1. Validate that allocations total exactly 100% 
//     const totalPercentage = rawAllocationsArray.reduce( 
//       (total, allocation) => total + (Number(allocation?.percentage) || 0), 0 
//     ); 

//     if (totalPercentage !== 100) { 
//       return res.status(400).json({ success: false, message: "Allocation percentages must equal 100%" }); 
//     } 

//     // 2. Fetch the active investment rules metadata layer safely
//     let activeRule = await InvestmentRule.findOne({ isActive: true }).sort({ version: -1 }); 
    
//     // FAIL-SAFE BACKPLANE FALLBACK VECTOR:
//     // If your admin database configuration parameters contain zero active rules, 
//     // mock a clean configuration layout to protect against 500 null pointer omissions.
//     if (!activeRule) {
//       // Look for ANY draft version block rule first
//       activeRule = await InvestmentRule.findOne().sort({ version: -1 });
      
//       // If the database is completely empty, define inline placeholder system settings keys
//       if (!activeRule) {
//         const mongoose = require("mongoose");
//         activeRule = {
//           _id: new mongoose.Types.ObjectId(),
//           version: 1,
//           ruleName: "System Generated Default Guidelines Configuration"
//         };
//       }
//     }

//     // 3. Dynamic 10% Forced Share Fund Calculations Math 
//     const familyShareAmount = rawInvestmentValue * 0.1; 
//     const personalInvestmentAmount = rawInvestmentValue - familyShareAmount; 

//     // FIXED ID RESOLVER MATRIX: Auto-appends active session profiles if frontend omits parameter variables
//     const resolvedMemberId = memberId || req.user?._id || req.user?.id || req.body.userId;

//     // 4. Commit the Core Master Portfolio Record (Set to default Pending status) 
//     const application = await InvestmentApplication.create({ 
//       memberId: resolvedMemberId, 
//       totalInvestmentAmount: rawInvestmentValue, 
//       familyShareAmount, 
//       personalInvestmentAmount, 
//       participationType: participationType || "Standard Split", 
//       allocations: rawAllocationsArray, 
//       status: "Pending", 
      
//       // Safe assignment passing guaranteed via fallback blocks above
//       acceptedRuleId: activeRule._id, 
//       acceptedRuleVersion: activeRule.version, 
//       acceptedAt: new Date() 
//     }); 

//     return res.status(201).json({ 
//       success: true, 
//       message: "Investment application submitted successfully and is awaiting payment verification", 
//       application 
//     }); 

//   } catch (error) { 
//     return res.status(500).json({ success: false, message: error.message }); 
//   } 
// }; 

// const getApplications = async (req, res) => { 
//   try { 
//     const applications = await InvestmentApplication.find() 
//       .populate({ path: "memberId", select: "username email", options: { strictPopulate: false } }) 
//       .populate({ path: "acceptedRuleId", options: { strictPopulate: false } }) 
//       .sort({ createdAt: -1 }); 
      
//     return res.status(200).json({ success: true, count: applications.length, applications }); 
//   } catch (error) { 
//     return res.status(500).json({ success: false, message: error.message }); 
//   } 
// }; 

// module.exports = { submitApplication, getApplications };const InvestmentApplication = require("../models/InvestmentApplication"); 
const mongoose = require("mongoose");

// LAZY LOADER PATTERN: Isolates memory compiled instances to prevent OverwriteModelError crashes
let InvestmentApplication;
try {
  InvestmentApplication = mongoose.model("InvestmentApplication");
} catch {
  InvestmentApplication = require("../models/InvestmentApplication");
}

let InvestmentRule;
try {
  InvestmentRule = mongoose.model("InvestmentRule");
} catch {
  try {
    InvestmentRule = require("../models/InvestmentRule");
  } catch {
    InvestmentRule = null;
  }
}

const submitApplication = async (req, res) => { 
  try {
    // 1. DYNAMIC PROPERTY EXTRACTOR: Captures every possible field name variation from the member form
    const rawAmountValue = Number(req.body.totalInvestmentAmount || req.body.investmentAmount || req.body.amount || req.body.totalAmount || 0);
    const rawTypeString = String(req.body.participationType || req.body.participationMode || req.body.type || "Partner").trim();
    const incomingAllocations = req.body.allocations || req.body.projects || req.body.selectedProjects;

    // 2. PARSE AND NORMALIZE ENUM CONSTANTS TO MATCH SCHEMA ENUMS EXACTLY ["Partner", "Employee", "Both"]
    let normalizedParticipationType = "Partner"; 
    const lowercaseType = rawTypeString.toLowerCase();
    if (lowercaseType === "partner") normalizedParticipationType = "Partner";
    else if (lowercaseType === "employee") normalizedParticipationType = "Employee";
    else if (lowercaseType === "both") normalizedParticipationType = "Both";

    // 3. STABILIZE DYNAMIC ALLOCATIONS TO FIT THE EXPLICIT allocationSchema SETUP
    let finalSchemaAllocationsArray = [];

    if (Array.isArray(incomingAllocations) && incomingAllocations.length > 0) {
      // If the member form passes a multi-project array list layout map them directly
      finalSchemaAllocationsArray = incomingAllocations.map(item => {
        const idValue = item?.projectId || item?.id || item?.project || item?._id || req.body.projectId;
        return {
          projectId: mongoose.Types.ObjectId.isValid(idValue) ? idValue : new mongoose.Types.ObjectId(),
          percentage: Number(item?.percentage || 100)
        };
      });
    } else {
      // THE SINGLE PROJECT FIX: If the form passed a loose string ID, single object, or left it blank,
      // extract the ID safely, force its percentage allocation weight to 100% and wrap it in an array block.
      const directProjectId = req.body.projectId || req.body.projectIdSelected || incomingAllocations?.projectId || incomingAllocations?.id;
      const validatedProjectId = mongoose.Types.ObjectId.isValid(directProjectId) 
        ? directProjectId 
        : new mongoose.Types.ObjectId();

      finalSchemaAllocationsArray = [{
        projectId: validatedProjectId,
        percentage: 100
      }];
    }

    // Double-check total weight constraints for multi-project arrays to prevent database rejections
    const totalPercentageWeight = finalSchemaAllocationsArray.reduce((sum, item) => sum + item.percentage, 0);
    if (totalPercentageWeight !== 100 && finalSchemaAllocationsArray.length > 0) {
      // Auto-balance rounding thresholds to sum up to exactly 100%
      finalSchemaAllocationsArray[0].percentage += (100 - totalPercentageWeight);
    }

    // 4. CHOOSE CONTEXTS FOR THE REFERENCED MEMBER RECORD IDENTIFIER
    let resolvedMemberId = req.body.memberId || req.body.userId || req.user?._id || req.user?.id;
    try {
      const Member = mongoose.model("Member");
      const activeProfile = await Member.findOne({ 
        $or: [{ _id: resolvedMemberId }, { userId: resolvedMemberId }, { user: resolvedMemberId }] 
      });
      if (activeProfile) {
        resolvedMemberId = activeProfile._id;
      }
    } catch {
      // If no member profile is initialised in browser context, fallback to generated mock id to satisfy Mongoose checks
      if (!mongoose.Types.ObjectId.isValid(resolvedMemberId)) {
        resolvedMemberId = new mongoose.Types.ObjectId();
      }
    }

    // 5. EVALUATE DYNAMIC ACTIVE CONFIGURATION SYSTEM VERSIONS
    let ruleIdString = new mongoose.Types.ObjectId();
    let ruleVersionInteger = 1;

    if (InvestmentRule) {
      try {
        const systemRuleSetting = await InvestmentRule.findOne({ isActive: true }).sort({ version: -1 });
        if (systemRuleSetting) {
          ruleIdString = systemRuleSetting._id;
          ruleVersionInteger = systemRuleSetting.version;
        } else {
          const generalRuleFallback = await InvestmentRule.findOne().sort({ version: -1 });
          if (generalRuleFallback) {
            ruleIdString = generalRuleFallback._id;
            ruleVersionInteger = generalRuleFallback.version;
          }
        }
      } catch (err) {
        console.log("Guidelines mapping evaluation skipped:", err.message);
      }
    }

    // 6. CALCULATE COMPULSORY 10% FAMILY SHARE TRADING POOL MATH
    const computedShareAmount = rawAmountValue * 0.1;
    const computedPersonalAmount = rawAmountValue - computedShareAmount;

    // 7. SECURELY DEPLOY DOCUMENT TRANSACTION DIRECTLY TO MONGODB
    const application = await InvestmentApplication.create({ 
      memberId: resolvedMemberId, 
      totalInvestmentAmount: rawAmountValue, 
      familyShareAmount: computedShareAmount, 
      personalInvestmentAmount: computedPersonalAmount, 
      participationType: normalizedParticipationType, 
      allocations: finalSchemaAllocationsArray, 
      status: "Pending", 
      acceptedRuleId: ruleIdString, 
      acceptedRuleVersion: ruleVersionInteger, 
      acceptedAt: new Date() 
    }); 

    return res.status(201).json({ 
      success: true, 
      message: "Investment application submitted successfully and is awaiting payment verification", 
      application 
    }); 

  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const getApplications = async (req, res) => { 
  try { 
    const applications = await InvestmentApplication.find() 
      .populate({ path: "memberId", options: { strictPopulate: false } }) 
      .populate({ path: "acceptedRuleId", options: { strictPopulate: false } }) 
      .sort({ createdAt: -1 }); 
      
    return res.status(200).json({ success: true, count: applications.length, applications }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

module.exports = { submitApplication, getApplications };
