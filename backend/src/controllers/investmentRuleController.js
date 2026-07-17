// const InvestmentRule = require("../models/InvestmentRule");

// const createRule = async (req, res) => {
//   try {
//     const latestRule = await InvestmentRule.findOne().sort({ version: -1 });
//     const version = latestRule ? latestRule.version + 1 : 1;

//     const rule = await InvestmentRule.create({
//       ...req.body,
//       version,
//       isActive: false // Force new rules to start as draft/inactive until explicitly enabled
//     });

//     return res.status(201).json({
//       success: true,
//       rule
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const getRules = async (req, res) => {
//   try {
//     const rules = await InvestmentRule.find().sort({ version: -1 });
//     return res.status(200).json({
//       success: true,
//       count: rules.length,
//       rules
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const getRuleById = async (req, res) => {
//   try {
//     const rule = await InvestmentRule.findById(req.params.id);
//     if (!rule) {
//       return res.status(404).json({
//         success: false,
//         message: "Rule not found"
//       });
//     }
//     return res.status(200).json({
//       success: true,
//       rule
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const updateRule = async (req, res) => {
//   try {
//     const existingRule = await InvestmentRule.findById(req.params.id);
//     if (!existingRule) {
//       return res.status(404).json({
//         success: false,
//         message: "Rule not found"
//       });
//     }

//     // Safety: If a rule is already active, lock modifications to preserve legal signing history integrity
//     if (existingRule.isActive) {
//       return res.status(400).json({
//         success: false,
//         message: "Modification denied: Active investment rules cannot be modified. Deactivate or create a new draft version instead."
//       });
//     }

//     // FIXED LAYER: Keeps the original version integer intact during minor edits instead of incrementing it out of bounds
//     const updatedRule = await InvestmentRule.findByIdAndUpdate(
//       req.params.id,
//       { ...req.body }, // Updates description or minimum amounts while protecting the target version index number
//       { new: true, runValidators: true }
//     );

//     return res.status(200).json({
//       success: true,
//       rule: updatedRule
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const activateRule = async (req, res) => {
//   try {
//     const targetRuleId = req.params.id;

//     // 1. FIXED EXCLUSIVITY MIDDLEWARE LAYER: Globally flip all other rules to inactive state first
//     // This prevents rule collisions and ensures only one legal system version remains active at any given moment
//     await InvestmentRule.updateMany({ _id: { $ne: targetRuleId } }, { $set: { isActive: false } });

//     // 2. Turn on the selected target configuration version
//     const rule = await InvestmentRule.findByIdAndUpdate(
//       targetRuleId,
//       { isActive: true },
//       { new: true }
//     );

//     if (!rule) {
//       return res.status(404).json({ success: false, message: "Rule file not found" });
//     }

//     return res.status(200).json({
//       success: true,
//       message: `Investment Rule Version ${rule.version} is now globally active.`,
//       rule
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const deactivateRule = async (req, res) => {
//   try {
//     const rule = await InvestmentRule.findByIdAndUpdate(
//       req.params.id,
//       { isActive: false },
//       { new: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Rule deactivated. System will lock submittals until a new alternative version is activated.",
//       rule
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// module.exports = {
//   createRule,
//   getRules,
//   getRuleById,
//   updateRule,
//   activateRule,
//   deactivateRule
// };
const mongoose = require("mongoose"); 
const { createAuditLog } = require("./auditLogController"); 

let InvestmentRule; 
try { 
  InvestmentRule = mongoose.model("InvestmentRule"); 
} catch { 
  InvestmentRule = require("../models/InvestmentRule"); 
} 

const createRule = async (req, res) => { 
  try { 
    const latestRule = await InvestmentRule.findOne().sort({ version: -1 }); 
    const version = latestRule ? latestRule.version + 1 : 1; 
    const rule = await InvestmentRule.create({ 
      ...req.body, 
      version, 
      isActive: false 
    }); 
    return res.status(201).json({ success: true, rule }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const getRules = async (req, res) => { 
  try { 
    const rules = await InvestmentRule.find().sort({ version: -1 }); 
    return res.status(200).json({ success: true, count: rules.length, rules }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const getRuleById = async (req, res) => { 
  try { 
    const rule = await InvestmentRule.findById(req.params.id); 
    if (!rule) { 
      return res.status(404).json({ success: false, message: "Rule not found" }); 
    } 
    return res.status(200).json({ success: true, rule }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const updateRule = async (req, res) => { 
  try { 
    const existingRule = await InvestmentRule.findById(req.params.id); 
    if (!existingRule) { 
      return res.status(404).json({ success: false, message: "Rule not found" }); 
    } 
    if (existingRule.isActive) { 
      return res.status(400).json({ success: false, message: "Modification denied: Active investment rules cannot be modified. Deactivate or create a new draft version instead." }); 
    } 
    const updatedRule = await InvestmentRule.findByIdAndUpdate( 
      req.params.id, 
      { ...req.body }, 
      { new: true, runValidators: true } 
    ); 
    return res.status(200).json({ success: true, rule: updatedRule }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const activateRule = async (req, res) => { 
  try { 
    const targetRuleId = req.params.id; 
    // FIXED MIDDLEWARE LAYER: mongoose is now correctly initialized at the top to clear this call cleanly
    await InvestmentRule.updateMany({ _id: { $ne: targetRuleId } }, { $set: { isActive: false } }); 
    
    const rule = await InvestmentRule.findByIdAndUpdate( 
      targetRuleId, 
      { isActive: true }, 
      { new: true } 
    ); 
    if (!rule) { 
      return res.status(404).json({ success: false, message: "Rule file not found" }); 
    } 
    return res.status(200).json({ success: true, message: `Investment Rule Version ${rule.version} is now globally active.`, rule }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const deactivateRule = async (req, res) => { 
  try { 
    const rule = await InvestmentRule.findByIdAndUpdate( 
      req.params.id, 
      { isActive: false }, 
      { new: true } 
    ); 
    return res.status(200).json({ success: true, message: "Rule deactivated. System will lock submittals until a new alternative version is activated.", rule }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

module.exports = { createRule, getRules, getRuleById, updateRule, activateRule, deactivateRule };
