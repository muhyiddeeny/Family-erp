const Member = require("../models/Member");
const House = require("../models/House");
const InvestmentApplication = require("../models/InvestmentApplication");
const EmploymentApplication = require("../models/EmploymentApplication");
const Donation = require("../models/Donation");

const person = (m) => ({
  name: `${m.firstName || ""} ${m.surname || ""}`.trim(),
  username: m.username || "",
  gender: m.gender || ""
});

/*
|--------------------------------------------------------------------------
| COUPLES WITHIN THE FAMILY
|--------------------------------------------------------------------------
| A couple is "confirmed" only when BOTH members have listed each other's
| username. One-sided links are reported separately as "pending".
*/
const buildCoupleAnalytics = async () => {
  const members = await Member.find().select("firstName surname username gender spouseUsername").lean();

  const byUsername = new Map(
    members.map((m) => [String(m.username || "").toLowerCase(), m])
  );

  const seenPairs = new Set();
  const confirmedCouples = [];
  const pendingLinks = [];

  for (const m of members) {
    const claimed = String(m.spouseUsername || "").trim();
    if (!claimed) continue;

    const partner = byUsername.get(claimed.toLowerCase());

    if (!partner) {
      pendingLinks.push({
        member: person(m),
        claimedPartner: claimed,
        reason: "No member found with that partner username"
      });
      continue;
    }

    const partnerPointsBack =
      String(partner.spouseUsername || "").trim().toLowerCase() === String(m.username || "").toLowerCase();

    if (partnerPointsBack) {
      const pairKey = [String(m._id), String(partner._id)].sort().join("-");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      confirmedCouples.push({ partnerOne: person(m), partnerTwo: person(partner) });
    } else {
      pendingLinks.push({
        member: person(m),
        claimedPartner: person(partner).name || claimed,
        reason: "Partner has not listed this member back yet"
      });
    }
  }

  return {
    totalCouples: confirmedCouples.length,
    pendingCount: pendingLinks.length,
    confirmedCouples,
    pendingLinks
  };
};

const getAnalytics = async (req, res) => {
  try {
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
          _id: null,
          diploma: { $sum: { $cond: [{ $eq: ["$diploma", "Yes"] }, 1, 0] } },
          nce: { $sum: { $cond: [{ $eq: ["$nce", "Yes"] }, 1, 0] } },
          hnd: { $sum: { $cond: [{ $eq: ["$hnd", "Yes"] }, 1, 0] } },
          degree: { $sum: { $cond: [{ $eq: ["$degree", "Yes"] }, 1, 0] } },
          masters: { $sum: { $cond: [{ $eq: ["$masters", "Yes"] }, 1, 0] } },
          phd: { $sum: { $cond: [{ $eq: ["$phd", "Yes"] }, 1, 0] } },

          kaida: { $sum: { $cond: [{ $eq: ["$kaida", "Yes"] }, 1, 0] } },
          alkhdari: { $sum: { $cond: [{ $eq: ["$alkhdari", "Yes"] }, 1, 0] } },
          ishmawi: { $sum: { $cond: [{ $eq: ["$ishmawi", "Yes"] }, 1, 0] } },
          iziyya: { $sum: { $cond: [{ $eq: ["$iziyya", "Yes"] }, 1, 0] } },
          kurdubi: { $sum: { $cond: [{ $eq: ["$kurdubi", "Yes"] }, 1, 0] } },
          mukhtasar: { $sum: { $cond: [{ $eq: ["$mukhtasar", "Yes"] }, 1, 0] } },

          totalJuzMemorized: { $sum: { $ifNull: ["$juzMemorized", 0] } },
          totalJuzWritten: { $sum: { $ifNull: ["$juzWritten", 0] } },

          states: { $push: { $ifNull: ["$state", "Unknown"] } },
          occupations: { $push: { $ifNull: ["$occupationCategory", "Unknown"] } },
          maritalStatuses: { $push: { $ifNull: ["$maritalStatus", "Unknown"] } },
          interests: { $push: { $ifNull: ["$opportunityInterest", "Unknown"] } }
        }
      }
    ]);

    const metrics = aggregationResult.length > 0 ? aggregationResult[0] : {
      diploma: 0, nce: 0, hnd: 0, degree: 0, masters: 0, phd: 0,
      kaida: 0, alkhdari: 0, ishmawi: 0, iziyya: 0, kurdubi: 0, mukhtasar: 0,
      totalJuzMemorized: 0, totalJuzWritten: 0,
      states: [], occupations: [], maritalStatuses: [], interests: []
    };

    const clusterData = (arr = []) => {
      if (!Array.isArray(arr)) return {};
      return arr.reduce((acc, val) => {
        if (val) acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
    };

    /*
    |--------------------------------------------------------------------------
    | MULTI-SELECT CHECKBOX SPLITTING TALLY RECONCILER
    |--------------------------------------------------------------------------
    */
    const parseOccupationSectorArrayData = (rawStringArray = []) => {
      const consolidatedTallySummary = {};
      if (!Array.isArray(rawStringArray)) return consolidatedTallySummary;

      rawStringArray.forEach(entry => {
        if (!entry || typeof entry !== "string" || entry === "Unknown") {
          consolidatedTallySummary["Unknown"] = (consolidatedTallySummary["Unknown"] || 0) + 1;
          return;
        }

        const splitTokens = entry.split(", ");
        splitTokens.forEach(token => {
          if (token) {
            const cleanTokenName = token.trim();
            if (cleanTokenName) {
              consolidatedTallySummary[cleanTokenName] = (consolidatedTallySummary[cleanTokenName] || 0) + 1;
            }
          }
        });
      });

      return consolidatedTallySummary;
    };

    let coupleAnalytics = { totalCouples: 0, pendingCount: 0, confirmedCouples: [], pendingLinks: [] };
    try {
      coupleAnalytics = await buildCoupleAnalytics();
    } catch (coupleError) {
      console.error("Couple analytics error:", coupleError);
    }

    return res.status(200).json({
      success: true,
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
      occupationAnalytics: parseOccupationSectorArrayData(metrics.occupations),
      maritalAnalytics: clusterData(metrics.maritalStatuses),
      opportunityAnalytics: clusterData(metrics.interests),
      coupleAnalytics
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
