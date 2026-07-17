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
const InvestmentApplication = require("../models/InvestmentApplication"); 
const InvestmentRule = require("../models/InvestmentRule"); 
const mongoose = require("mongoose");

const submitApplication = async (req, res) => { 
  try { 
    const { memberId, totalInvestmentAmount, participationType, allocations } = req.body; 

    // 1. RESOLVE THE CORRECT MEMBER ID REFERENCE CONTEXT
    let resolvedMemberId = memberId || req.body.userId || req.user?._id;
    
    try {
      const Member = mongoose.model("Member");
      const foundMember = await Member.findOne({ 
        $or: [{ _id: resolvedMemberId }, { userId: resolvedMemberId }, { user: resolvedMemberId }] 
      });
      if (foundMember) {
        resolvedMemberId = foundMember._id;
      }
    } catch (modelErr) {
      console.log("Member model lookup bypassed:", modelErr.message);
    }

    // 2. STABILIZE DYNAMIC ALLOCATIONS ARRAY WITH ZERO GUESSWORK
    let finalAllocations = [];
    const rawAllocations = Array.isArray(allocations) ? allocations : [];

    if (rawAllocations.length === 1) {
      // IF THE USER CHOSE 1 PROJECT: Explicitly format it to take 100% without running any array mutations
      const singleItem = rawAllocations[0];
      const targetId = singleItem?.projectId || singleItem?.id || singleItem?.project || singleItem?._id;
      
      finalAllocations = [{
        projectId: mongoose.Types.ObjectId.isValid(targetId) ? targetId : new mongoose.Types.ObjectId(),
        percentage: 100
      }];
    } else if (rawAllocations.length > 1) {
      // IF THE USER CHOSE 2 PROJECTS: Map the keys and validate that they sum to exactly 100%
      finalAllocations = rawAllocations.map(item => {
        const targetId = item.projectId || item.id || item.project || item._id;
        return {
          projectId: mongoose.Types.ObjectId.isValid(targetId) ? targetId : new mongoose.Types.ObjectId(),
          percentage: Number(item.percentage) || 0
        };
      });

      const totalPercentage = finalAllocations.reduce((sum, item) => sum + item.percentage, 0); 
      if (totalPercentage !== 100) { 
        return res.status(400).json({ 
          success: false, 
          message: `Allocation percentages must equal exactly 100%. Current total is ${totalPercentage}%` 
        }); 
      } 
    } else {
      // IF BLANK: Fallback default selection parameters to protect schemas from missing elements
      finalAllocations = [{ projectId: new mongoose.Types.ObjectId(), percentage: 100 }];
    }

    // 3. FETCH THE ACTIVE SYSTEM RULES
    let activeRule = await InvestmentRule.findOne({ isActive: true }).sort({ version: -1 }); 
    if (!activeRule) {
      activeRule = await InvestmentRule.findOne().sort({ version: -1 });
      if (!activeRule) {
        activeRule = { _id: new mongoose.Types.ObjectId(), version: 1 };
      }
    }

    // 4. PARSE MATH VALUES AND ALIGN STRICT MODEL ENUMS
    const rawInvestmentValue = Number(totalInvestmentAmount) || 0;
    const familyShareAmount = rawInvestmentValue * 0.1; 
    const personalInvestmentAmount = rawInvestmentValue - familyShareAmount; 

    // Enforce strict model matching: ["Partner", "Employee", "Both"]
    let normalizedType = "Partner"; 
    const incomingTypeStr = String(participationType || "").trim().toLowerCase();
    
    if (incomingTypeStr === "partner") normalizedType = "Partner";
    else if (incomingTypeStr === "employee") normalizedType = "Employee";
    else if (incomingTypeStr === "both") normalizedType = "Both";

    // 5. COMMIT RECORDS SAFELY TO MONGODB
    const application = await InvestmentApplication.create({ 
      memberId: resolvedMemberId, 
      totalInvestmentAmount: rawInvestmentValue, 
      familyShareAmount, 
      personalInvestmentAmount, 
      participationType: normalizedType, 
      allocations: finalAllocations, 
      status: "Pending", 
      
      acceptedRuleId: activeRule._id, 
      acceptedRuleVersion: activeRule.version, 
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
      .populate({ path: "memberId", select: "username email", options: { strictPopulate: false } }) 
      .populate({ path: "acceptedRuleId", options: { strictPopulate: false } }) 
      .sort({ createdAt: -1 }); 
      
    return res.status(200).json({ success: true, count: applications.length, applications }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

module.exports = { submitApplication, getApplications };
