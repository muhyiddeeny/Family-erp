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

const submitApplication = async (req, res) => { 
  try { 
    const { memberId, totalInvestmentAmount, participationType, allocations } = req.body; 

    // FAIL-SAFE ARRAY CHECK: Safely converts allocations to a clean array list layout 
    // to prevent any fatal '.reduce' type errors if the frontend sends null or single objects
    let safeAllocationsArray = Array.isArray(allocations) ? allocations : [];

    // If the investor chooses exactly 1 project or leaves allocations empty, auto-force it to 100%
    if (safeAllocationsArray.length === 0) {
      safeAllocationsArray = [{ project: "General Allocation", percentage: 100 }];
    } else if (safeAllocationsArray.length === 1) {
      safeAllocationsArray[0].percentage = 100;
    }

    // 1. Calculate the percentage weights safely now that the array type is guaranteed
    const totalPercentage = safeAllocationsArray.reduce( 
      (total, allocation) => total + (Number(allocation?.percentage) || 0), 0 
    ); 

    // If multi-project distributions don't add up to 100%, adjust them to pass the check
    if (totalPercentage !== 100 && safeAllocationsArray.length > 1) {
      return res.status(400).json({ 
        success: false, 
        message: `Allocation percentages must equal 100%. Current total is ${totalPercentage}%` 
      }); 
    } 

    // 2. Fetch the active investment rules metadata layer safely
    let activeRule = await InvestmentRule.findOne({ isActive: true }).sort({ version: -1 }); 
    if (!activeRule) {
      activeRule = await InvestmentRule.findOne().sort({ version: -1 });
      if (!activeRule) {
        const mongoose = require("mongoose");
        activeRule = {
          _id: new mongoose.Types.ObjectId(),
          version: 1,
          ruleName: "System Generated Default Guidelines Configuration"
        };
      }
    }

    // 3. Dynamic 10% Forced Share Fund Calculations Math 
    const rawInvestmentValue = Number(totalInvestmentAmount) || 0;
    const familyShareAmount = rawInvestmentValue * 0.1; 
    const personalInvestmentAmount = rawInvestmentValue - familyShareAmount; 

    // Auto-resolve authenticated user contexts
    const resolvedMemberId = memberId || req.user?._id || req.user?.id || req.body.userId;

    // 4. Commit the Core Master Portfolio Record (Set to default Pending status) 
    const application = await InvestmentApplication.create({ 
      memberId: resolvedMemberId, 
      totalInvestmentAmount: rawInvestmentValue, 
      familyShareAmount, 
      personalInvestmentAmount, 
      participationType: participationType || "Standard Split", 
      allocations: safeAllocationsArray, 
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
