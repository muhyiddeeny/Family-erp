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

// Enable connections from frontend
app.use(cors({ origin: true, credentials: true })); 
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

// FIXED LAYER: Wrapped initialization inside an async lifecycle chain to guarantee database connection sync
const initializeServerInstance = async () => {
  try {
    // Force the execution stack to explicitly wait until the database link is fully connected and established
    await connectDatabase();
    
    app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);

      try {
        // 1. Check and auto-create the baseline SuperAdmin row record in your Role collection
        let superAdminRole = await Role.findOne({ name: "SuperAdmin" });
        if (!superAdminRole) {
          superAdminRole = await Role.create({
            name: "SuperAdmin",
            description: "Root master administrator with unrestricted development access parameters."
          });
          console.log("[INITIALIZER]: Baseline SuperAdmin system role created successfully.");
        }

        // 2. Ensure baseline Member role document is initialized as a safe sign-up fallback choice
        let memberRole = await Role.findOne({ name: "Member" });
        if (!memberRole) {
          await Role.create({
            name: "Member",
            description: "Standard registered user credential layout template."
          });
        }

        // 3. Look in the database to see if this admin user credentials record exists
        const adminExists = await User.findOne({ email: "admin@family.com" });

        // 4. If no admin exists, provision it right now with an embedded relational link!
        if (!adminExists) {
          const passwordHash = await bcrypt.hash("SuperAdmin123!", 10);

          await User.create({
            username: "superadmin",
            email: "admin@family.com",
            passwordHash: passwordHash,
            role: "SuperAdmin",
            roleId: superAdminRole._id 
          });

          console.log("--------------------------------------------------");
          console.log("SUCCESS: Default SuperAdmin Account Provisioned!");
          console.log("Email: ababa4phone@gmail.com");
          console.log("Password: ababa4phone");
          console.log("Role Reference: Linked Dynamically");
          console.log("--------------------------------------------------");
        }
      } catch (innerError) {
        console.log("Could not auto-create admin account:", innerError.message);
      }
    });
  } catch (startupError) {
    console.error("Critical System Initialization Failure:", startupError.message);
    process.exit(1);
  }
};

// Execute the secure bootstrapper loop sequence
initializeServerInstance();
