const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors"); 
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");
const Role = require("./src/models/Role"); 

const connectDatabase = require("./src/config/database");
const startInvestmentExpiryJob = require("./src/jobs/investmentExpiryJob");

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/
const authRoutes = require("./src/routes/authRoutes");
const membershipApplicationRoutes = require("./src/routes/membershipApplicationRoutes");
const memberRoutes = require("./src/routes/memberRoutes");
const profileUpdateRoutes = require("./src/routes/profileUpdateRoutes");
const houseRoutes = require("./src/routes/houseRoutes");
const auditLogRoutes = require("./src/routes/auditLogRoutes");
const permissionRoutes = require("./src/routes/permissionRoutes");
const businessCategoryRoutes = require("./src/routes/businessCategoryRoutes");
const investmentProjectRoutes = require("./src/routes/investmentProjectRoutes");
const investmentRuleRoutes = require("./src/routes/investmentRuleRoutes");
const investmentApplicationRoutes = require("./src/routes/investmentApplicationRoutes");
const investmentApprovalRoutes = require("./src/routes/investmentApprovalRoutes");
const investmentExpirySettingRoutes = require("./src/routes/investmentExpirySettingRoutes");
const familyShareFundRoutes = require("./src/routes/familyShareFundRoutes");
const employmentApplicationRoutes = require("./src/routes/employmentApplicationRoutes");
const donationRoutes = require("./src/routes/donationRoutes");
const businessOperationRoutes = require("./src/routes/businessOperationRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const announcementRoutes = require("./src/routes/announcementRoutes");
const searchRoutes = require("./src/routes/searchRoutes");

dotenv.config();

const app = express();

// FIXED CORS LAYER: Replaces generic origin checking with an explicit white-list rule for Netlify
app.use(cors({
  origin: "https://namasge-family.netlify.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
})); 
app.use(express.json());

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Family Management Platform API Running"
  });
});

/*
|--------------------------------------------------------------------------
| ROUTE MIDDLEWARES
|--------------------------------------------------------------------------
*/
app.use("/api/auth", authRoutes);
app.use("/api/membership", membershipApplicationRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/profile-updates", profileUpdateRoutes);
app.use("/api/houses", houseRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/business-categories", businessCategoryRoutes);
app.use("/api/investment-projects", investmentProjectRoutes);
app.use("/api/investment-rules", investmentRuleRoutes);
app.use("/api/investment-applications", investmentApplicationRoutes);
app.use("/api/investment-approvals", investmentApprovalRoutes);
app.use("/api/investment-expiry-settings", investmentExpirySettingRoutes);
app.use("/api/family-share-fund", familyShareFundRoutes);
app.use("/api/employment-applications", employmentApplicationRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/business-operations", businessOperationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/search", searchRoutes);

/*
|--------------------------------------------------------------------------
| JOBS
|--------------------------------------------------------------------------
*/
startInvestmentExpiryJob();

/*
|--------------------------------------------------------------------------
| SERVER START & ASYNC CONNECTIONS ORCHESTRATION PIPELINE
|--------------------------------------------------------------------------
*/
const PORT = process.env.PORT || 5000;

const initializeServerInstance = async () => {
  try {
    await connectDatabase();
    
    app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);

      try {
        let superAdminRole = await Role.findOne({ name: "SuperAdmin" });
        if (!superAdminRole) {
          superAdminRole = await Role.create({
            name: "SuperAdmin",
            description: "Root master administrator with unrestricted development access parameters."
          });
          console.log("[INITIALIZER]: Baseline SuperAdmin system role created.");
        }

        let memberRole = await Role.findOne({ name: "Member" });
        if (!memberRole) {
          await Role.create({
            name: "Member",
            description: "Standard registered user credential layout template."
          });
        }

        // Generate clean hashed target password variables
        const targetHash = await bcrypt.hash("ababa4phone", 10);
        const targetEmail = "ababa4phone@gmail.com";

        // MONGOOSE FORCE UPSERT REMAPPING ENGINE: Drops, cleans, creates, or syncs matching records immediately
        const masterAdminProfile = await User.findOneAndUpdate(
          { email: targetEmail },
          {
            $set: {
              username: "superadmin",
              passwordHash: targetHash,
              role: "SuperAdmin",
              roleId: superAdminRole._id
            }
          },
          { upsert: true, new: true, runValidators: false }
        );

        console.log("--------------------------------------------------");
        console.log("🔥 FORCE REGISTER PIPELINE EXECUTION SUCCESSFUL!");
        console.log("Document ID:", masterAdminProfile._id);
        console.log("Target Email:", targetEmail);
        console.log("Clear Text Passphrase Verification: ababa4phone");
        console.log("--------------------------------------------------");

      } catch (innerError) {
        console.log("Could not auto-create admin account:", innerError.message);
      }
    });
  } catch (startupError) {
    console.error("Critical System Initialization Failure:", startupError.message);
    process.exit(1);
  }
};

initializeServerInstance();
