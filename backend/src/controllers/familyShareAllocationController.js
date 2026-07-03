const FamilyShareFundLedger = require("../models/FamilyShareFundLedger");
const { createAuditLog } = require("./auditLogController");

const allocateProfit = async (req, res) => {
  try {
    const { memberId, projectId, amount } = req.body;

    if (!memberId || !projectId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid memberId, projectId, and allocation amount are required"
      });
    }

    // 1. Fetch the absolute latest historical record row to compute the running pool balance safely
    const lastLedger = await FamilyShareFundLedger.findOne().sort({ createdAt: -1 });
    const runningBalance = (lastLedger?.runningBalance || 0) + Number(amount);

    // 2. Commit the assigned immutable ledger transaction block
    const ledger = await FamilyShareFundLedger.create({
      transactionId: `PROFIT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      memberId,
      projectId,
      investmentAmount: 0, // Baseline modifier for pure dividend events
      familyShareAmount: 0,
      profitAllocation: Number(amount),
      lossAllocation: 0,
      runningBalance
    });

    // 3. Document the dividend payment event within your secure audit ledger
    await createAuditLog({
      userId: req.user?._id,
      module: "Family Share Fund",
      action: "Profit Allocated",
      oldValue: "None",
      newValue: JSON.stringify({ ledgerId: ledger._id, memberId, projectId, profit: amount }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({
      success: true,
      message: "Profit dividend successfully distributed and logged to share ledger",
      ledger
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const allocateLoss = async (req, res) => {
  try {
    const { memberId, projectId, amount } = req.body;

    if (!memberId || !projectId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid memberId, projectId, and loss write-down amount are required"
      });
    }

    const lastLedger = await FamilyShareFundLedger.findOne().sort({ createdAt: -1 });
    
    // Safety check: Prevent pool balance from dropping below zero into critical deficit values
    const startingBalance = lastLedger?.runningBalance || 0;
    if (startingBalance - Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: `Accounting Reject: Allocated loss (${amount}) exceeds total current pool reserve balance (${startingBalance})`
      });
    }

    const runningBalance = startingBalance - Number(amount);

    const ledger = await FamilyShareFundLedger.create({
      transactionId: `LOSS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      memberId,
      projectId,
      investmentAmount: 0,
      familyShareAmount: 0,
      profitAllocation: 0,
      lossAllocation: Number(amount),
      runningBalance
    });

    await createAuditLog({
      userId: req.user?._id,
      module: "Family Share Fund",
      action: "Loss Allocated",
      oldValue: "None",
      newValue: JSON.stringify({ ledgerId: ledger._id, memberId, projectId, loss: amount }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({
      success: true,
      message: "Loss statement allocated and written down against selected portfolio asset",
      ledger
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  allocateProfit,
  allocateLoss
};
