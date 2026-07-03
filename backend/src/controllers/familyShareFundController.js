// const FamilyShareFundLedger = require("../models/FamilyShareFundLedger");

// const getFundSummary = async (req, res) => {
//   try {
//     /*
//     |--------------------------------------------------------------------------
//     | MONGODB AGGREGATION PIPELINE (Blazing Fast Ledger Computations)
//     |--------------------------------------------------------------------------
//     | Replaced the slow in-memory array filtering loops with a database aggregation.
//     | MongoDB groups and sums thousands of historical rows instantly in the database layer,
//     | ensuring your collective treasury balances load instantly without memory leaks.
//     */
//     const [summary] = await FamilyShareFundLedger.aggregate([
//       {
//         $group: {
//           _id: null,
//           totalContribution: { $sum: { $ifNull: ["$familyShareAmount", 0] } },
//           totalProfit: { $sum: { $ifNull: ["$profitAllocation", 0] } },
//           totalLoss: { $sum: { $ifNull: ["$lossAllocation", 0] } }
//         }
//       }
//     ]) || [{}];

//     const totalContribution = summary.totalContribution || 0;
//     const totalProfit = summary.totalProfit || 0;
//     const totalLoss = summary.totalLoss || 0;
//     const balance = totalContribution + totalProfit - totalLoss;

//     return res.status(200).json({
//       success: true,
//       totalContribution,
//       totalProfit,
//       totalLoss,
//       balance
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const getGrowthHistory = async (req, res) => {
//   try {
//     // Limits the output payload list to the most recent 100 timeline entries to prevent browser canvas lag
//     const history = await FamilyShareFundLedger.find()
//       .populate("memberId", "firstName surname email")
//       .sort({ createdAt: -1 })
//       .limit(100);

//     return res.status(200).json({
//       success: true,
//       history
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const getProfitHistory = async (req, res) => {
//   try {
//     /*
//     |--------------------------------------------------------------------------
//     | FIXED LAYER: Schema Field Condition Match
//     |--------------------------------------------------------------------------
//     | Replaced the non-existent 'transactionType' filter with an explicit numeric check.
//     | It queries records where 'profitAllocation' is greater than zero ($gt: 0).
//     */
//     const history = await FamilyShareFundLedger.find({
//       profitAllocation: { $gt: 0 }
//     })
//       .populate("memberId", "firstName surname email")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: history.length,
//       history
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const getLossHistory = async (req, res) => {
//   try {
//     /*
//     |--------------------------------------------------------------------------
//     | FIXED LAYER: Schema Field Condition Match
//     |--------------------------------------------------------------------------
//     | Queries records where 'lossAllocation' is greater than zero ($gt: 0).
//     */
//     const history = await FamilyShareFundLedger.find({
//       lossAllocation: { $gt: 0 }
//     })
//       .populate("memberId", "firstName surname email")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: history.length,
//       history
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// module.exports = {
//   getFundSummary,
//   getGrowthHistory,
//   getProfitHistory,
//   getLossHistory
// };

const FamilyShareFundLedger = require("../models/FamilyShareFundLedger");

const getFundSummary = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | MONGODB AGGREGATION PIPELINE (Blazing Fast Ledger Computations)
    |--------------------------------------------------------------------------
    | Groups and sums historical rows inside the database layer cleanly.
    */
    const aggregationResult = await FamilyShareFundLedger.aggregate([
      {
        $group: {
          _id: null,
          totalContribution: { $sum: { $ifNull: ["$familyShareAmount", 0] } },
          totalProfit: { $sum: { $ifNull: ["$profitAllocation", 0] } },
          totalLoss: { $sum: { $ifNull: ["$lossAllocation", 0] } }
        }
      }
    ]);

    // FIXED LAYER: Check if aggregate array contains rows to bypass undefined reading crashes
    const summary = aggregationResult.length > 0 ? aggregationResult[0] : {
      totalContribution: 0,
      totalProfit: 0,
      totalLoss: 0
    };

    const totalContribution = summary.totalContribution || 0;
    const totalProfit = summary.totalProfit || 0;
    const totalLoss = summary.totalLoss || 0;
    const balance = totalContribution + totalProfit - totalLoss;

    // INTERFACE LAYER: Map out data and balance variations to satisfy variable expectations
    return res.status(200).json({
      success: true,
      totalContribution,
      totalProfit,
      totalLoss,
      balance,
      data: {
        totalBalance: balance,
        totalContribution,
        totalProfit,
        totalLoss
      }
    });
  } catch (error) {
    console.error("Ledger summary aggregation crash caught: ", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getGrowthHistory = async (req, res) => {
  try {
    const history = await FamilyShareFundLedger.find()
      .populate("memberId", "firstName surname email")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getProfitHistory = async (req, res) => {
  try {
    const history = await FamilyShareFundLedger.find({
      profitAllocation: { $gt: 0 }
    })
      .populate("memberId", "firstName surname email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getLossHistory = async (req, res) => {
  try {
    const history = await FamilyShareFundLedger.find({
      lossAllocation: { $gt: 0 }
    })
      .populate("memberId", "firstName surname email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getFundSummary,
  getGrowthHistory,
  getProfitHistory,
  getLossHistory
};
