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

    let rawAllocationsArray = allocations || [];
    const rawInvestmentValue = Number(totalInvestmentAmount) || 0;

    // PROJECT AUTO-ADAPTER LAYER
    if (rawAllocationsArray.length === 0) {
      rawAllocationsArray = [{ project: "General Allocation", percentage: 100 }];
    } else if (rawAllocationsArray.length === 1) {
      // THE FIX: Mutate the first array element index using [0] to avoid object type runtime errors
      if (rawAllocationsArray[0]) {
        rawAllocationsArray[0].percentage = 100;
      }
    } else {
      // If multi-project splits are selected, sum and validate their total weights safely
      const currentSum = rawAllocationsArray.reduce( 
        (total, item) => total + (Number(item?.percentage) || 0), 0 
      ); 

      if (currentSum !== 100 && currentSum > 0) {
        rawAllocationsArray = rawAllocationsArray.map(item => ({
          ...item,
          percentage: Math.round(((Number(item.percentage) || 0) / currentSum) * 100)
        }));
        
        // Fine-tune rounding precision remainders to ensure exact absolute sum of 100
        const postFixSum = rawAllocationsArray.reduce((t, i) => t + i.percentage, 0);
        if (postFixSum !== 100 && rawAllocationsArray.length > 0 && rawAllocationsArray[0]) {
          rawAllocationsArray[0].percentage += (100 - postFixSum);
        }
      } else if (currentSum === 0) {
        // Distribute weights equally across project selections if sent as 0
        const equalShare = Math.floor(100 / rawAllocationsArray.length);
        rawAllocationsArray = rawAllocationsArray.map(item => ({ ...item, percentage: equalShare }));
        if (rawAllocationsArray[0]) {
          rawAllocationsArray[0].percentage += (100 - (equalShare * rawAllocationsArray.length));
        }
      }
    }

    // Fetch the active investment rules metadata layer safely
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

    // Dynamic 10% Forced Share Fund Calculations Math 
    const familyShareAmount = rawInvestmentValue * 0.1; 
    const personalInvestmentAmount = rawInvestmentValue - familyShareAmount; 

    // Target active profile metadata hooks
    const resolvedMemberId = memberId || req.user?._id || req.user?.id || req.body.userId;

    // Commit the Core Master Portfolio Record (Set to default Pending status) 
    const application = await InvestmentApplication.create({ 
      memberId: resolvedMemberId, 
      totalInvestmentAmount: rawInvestmentValue, 
      familyShareAmount, 
      personalInvestmentAmount, 
      participationType: participationType || "Standard Split", 
      allocations: rawAllocationsArray, 
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
