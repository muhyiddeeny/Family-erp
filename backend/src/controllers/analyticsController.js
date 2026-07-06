const Member = require("../models/Member");
const House = require("../models/House");
const InvestmentApplication = require("../models/InvestmentApplication");
const EmploymentApplication = require("../models/EmploymentApplication");
const Donation = require("../models/Donation");

const getAnalytics = async (req, res) => {
  try {
    // 1. Run top-level summaries concurrently using parallel promises (saves network wait time)
    const [
      totalMembers,
      maleMembers,
      femaleMembers,
      houses,
      investments,
      employmentApplications,
      donations
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ gender: "Male" }),
      Member.countDocuments({ gender: "Female" }),
      House.countDocuments(),
      InvestmentApplication.countDocuments(),
      EmploymentApplication.countDocuments(),
      Donation.countDocuments()
    ]);

    /*
    |--------------------------------------------------------------------------
    | MONGODB AGGREGATION PIPELINE (Blazing Fast Analytics Math)
    |--------------------------------------------------------------------------
    */
    const aggregationResult = await Member.aggregate([
      {
        $group: {
          id: null,
          // Education Tallies (Evaluates dynamically if fields exist/are true)
          diploma: { $sum: { $cond: [{ $eq: ["$diploma", "Yes"] }, 1, 0] } },
          nce: { $sum: { $cond: [{ $eq: ["$nce", "Yes"] }, 1, 0] } },
          hnd: { $sum: { $cond: [{ $eq: ["$hnd", "Yes"] }, 1, 0] } },
          degree: { $sum: { $cond: [{ $eq: ["$degree", "Yes"] }, 1, 0] } },
          masters: { $sum: { $cond: [{ $eq: ["$masters", "Yes"] }, 1, 0] } },
          phd: { $sum: { $cond: [{ $eq: ["$phd", "Yes"] }, 1, 0] } },

          // Islamic Knowledge Level Tallies
          kaida: { $sum: { $cond: [{ $eq: ["$kaida", "Yes"] }, 1, 0] } },
          alkhdari: { $sum: { $cond: [{ $eq: ["$alkhdari", "Yes"] }, 1, 0] } },
          ishmawi: { $sum: { $cond: [{ $eq: ["$ishmawi", "Yes"] }, 1, 0] } },
          iziyya: { $sum: { $cond: [{ $eq: ["$iziyya", "Yes"] }, 1, 0] } },
          kurdubi: { $sum: { $cond: [{ $eq: ["$kurdubi", "Yes"] }, 1, 0] } },
          mukhtasar: { $sum: { $cond: [{ $eq: ["$mukhtasar", "Yes"] }, 1, 0] } },

          // Quranic Juz Metrics Accumulation
          totalJuzMemorized: { $sum: { $ifNull: ["$juzMemorized", 0] } },
          totalJuzWritten: { $sum: { $ifNull: ["$juzWritten", 0] } },

          // Push arrays for dynamic key-value clustering (States, Occupations, etc.)
          states: { $push: { $ifNull: ["$state", "Unknown"] } },
          
          // COMPATIBILITY INTERFACE LAYER: Point directly to your true database field name 'occupationCategory'
          occupations: { $push: { $ifNull: ["$occupationCategory", "Unknown"] } },
          
          maritalStatuses: { $push: { $ifNull: ["$maritalStatus", "Unknown"] } },
          interests: { $push: { $ifNull: ["$opportunityInterest", "Unknown"] } }
        }
      }
    ]);

    // FIXED LAYER: Safely assign fallback defaults if array is empty or uninitialized
    const metrics = aggregationResult.length > 0 ? aggregationResult[0] : {
      diploma: 0, nce: 0, hnd: 0, degree: 0, masters: 0, phd: 0,
      kaida: 0, alkhdari: 0, ishmawi: 0, iziyya: 0, kurdubi: 0, mukhtasar: 0,
      totalJuzMemorized: 0, totalJuzWritten: 0,
      states: [], occupations: [], maritalStatuses: [], interests: []
    };

    // Helper function to transform array lists into grouped frequency objects
    const clusterData = (arr = []) => {
      if (!Array.isArray(arr)) return {};
      return arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
    };

    /*
    |--------------------------------------------------------------------------
    | MULTI-SELECT CHECKBOX SPLITTING TALLY RECONCILER
    |--------------------------------------------------------------------------
    | Separates comma-spaced string elements into standalone, clean sector 
    | names so individuals who check multiple industries get tallied accurately.
    */
    const parseOccupationSectorArrayData = (rawStringArray = []) => {
      const consolidatedTallySummary = {};
      
      rawStringArray.forEach(entry => {
        if (!entry || entry === "Unknown") {
          consolidatedTallySummary["Unknown"] = (consolidatedTallySummary["Unknown"] || 0) + 1;
          return;
        }
        
        // Break compound entries like "Farmer, Artisan" into individual words
        const splitTokens = entry.split(", ");
        splitTokens.forEach(token => {
          const cleanTokenName = token.trim();
          if (cleanTokenName) {
            consolidatedTallySummary[cleanTokenName] = (consolidatedTallySummary[cleanTokenName] || 0) + 1;
          }
        });
      });
      
      return consolidatedTallySummary;
    };

    // COMPATIBILITY INTERFACE LAYER: Map fields so frontend destructuring keys always match up
    return res.status(200).json({
      success: true,
      data: {
        totalMembers,
        houses,
        totalInvestmentVolume: 0, 
        totalFamilyShareVolume: 0, 
        totalDonationVolume: 0, 
        totalDonationsCount: donations
      },
      summaryCards: {
        totalMembers,
        houses,
        investments,
        employmentApplications,
        donations
      },
      genderAnalytics: {
        male: maleMembers,
        female: femaleMembers
      },
      educationAnalytics: {
        diploma: metrics.diploma || 0,
        nce: metrics.nce || 0,
        hnd: metrics.hnd || 0,
        degree: metrics.degree || 0,
        masters: metrics.masters || 0,
        phd: metrics.phd || 0
      },
      islamicKnowledgeAnalytics: {
        kaida: metrics.kaida || 0,
        alkhdari: metrics.alkhdari || 0,
        ishmawi: metrics.ishmawi || 0,
        iziyya: metrics.iziyya || 0,
        kurdubi: metrics.kurdubi || 0,
        mukhtasar: metrics.mukhtasar || 0
      },
      quranAnalytics: {
        totalJuzMemorized: metrics.totalJuzMemorized || 0,
        totalJuzWritten: metrics.totalJuzWritten || 0
      },
      locationAnalytics: clusterData(metrics.states),
      
      // FIXED LAYER: Replaces old clusterData to accurately split and tally checkboxes
      occupationAnalytics: parseOccupationSectorArrayData(metrics.occupations),
      
      maritalAnalytics: clusterData(metrics.maritalStatuses),
      opportunityAnalytics: clusterData(metrics.interests)
    });

  } catch (error) {
    console.error("Backend Analytics Crash: ", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAnalytics
};
