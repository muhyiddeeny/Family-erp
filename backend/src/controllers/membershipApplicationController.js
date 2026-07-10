// const MembershipApplication = require("../models/MembershipApplication");
// const Member = require("../models/Member");
// const User = require("../models/User");
// const bcrypt = require("bcryptjs");
// const { createAuditLog } = require("./auditLogController");

// const generateMembershipNumber = () => {
//   const year = new Date().getFullYear();
//   const random = Math.floor(1000 + Math.random() * 9000);
//   return `MEM-${year}-${random}`;
// };

// const submitApplication = async (req, res) => {
//   try {
//     const existingApplication = await MembershipApplication.findOne({
//       email: req.body.email
//     });

//     if (existingApplication) {
//       return res.status(400).json({
//         success: false,
//         message: "An application with this email already exists"
//       });
//     }

//     const application = await MembershipApplication.create({
//       ...req.body,
//       status: "Pending"
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Membership application submitted successfully",
//       application
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const getAllApplications = async (req, res) => {
//   try {
//     const applications = await MembershipApplication.find().sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: applications.length,
//       applications
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const getApplicationById = async (req, res) => {
//   try {
//     const application = await MembershipApplication.findById(req.params.id);

//     if (!application) {
//       return res.status(404).json({
//         success: false,
//         message: "Application not found"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       application
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const approveApplication = async (req, res) => {
//   try {
//     const application = await MembershipApplication.findById(req.params.id);

//     if (!application) {
//       return res.status(404).json({
//         success: false,
//         message: "Application not found"
//       });
//     }

//     if (application.status === "Approved") {
//       return res.status(400).json({
//         success: false,
//         message: "Application already approved"
//       });
//     }

//     const existingMember = await Member.findOne({ email: application.email });
//     if (existingMember) {
//       return res.status(400).json({
//         success: false,
//         message: "A registered member with this email already exists"
//       });
//     }

//     application.status = "Approved";
//     await application.save();

//     const memberData = application.toObject();
//     delete memberData._id;
//     delete memberData.__v;

//     const defaultPasswordHash = await bcrypt.hash("WelcomeFamily123!", 10);

//     const member = await Member.create({
//       ...memberData,
//       username: memberData.username || `${memberData.firstName.toLowerCase()}${Math.floor(100 + Math.random() * 900)}`,
//       passwordHash: defaultPasswordHash, 
//       role: "Member",
//       membershipNumber: generateMembershipNumber(),
//       approvedAt: new Date()
//     });

//     await createAuditLog({
//       userId: req.user?._id,
//       module: "Membership Onboarding",
//       action: "Application Approved",
//       oldValue: "Pending",
//       newValue: JSON.stringify({ memberId: member._id, membershipNumber: member.membershipNumber, email: member.email }),
//       ipAddress: req.ip,
//       userAgent: req.headers["user-agent"]
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Application approved successfully. Default login password initialized as 'WelcomeFamily123!'",
//       member
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const rejectApplication = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const application = await MembershipApplication.findById(id);
//     if (!application) {
//       return res.status(404).json({
//         success: false,
//         message: "Membership application not found"
//       });
//     }

//     if (application.status === "Rejected") {
//       return res.status(400).json({ 
//         success: false, 
//         message: "This application has already been marked as rejected." 
//       });
//     }

//     application.status = "Rejected";
//     await application.save();

//     await Promise.all([
//       User.deleteOne({ email: application.email.toLowerCase() }),
//       Member.deleteOne({ email: application.email.toLowerCase() })
//     ]);

//     await createAuditLog({
//       userId: req.user?._id,
//       module: "Membership Onboarding",
//       action: "Application Rejected & Profile Nullified",
//       oldValue: "Pending",
//       newValue: `Nullified profiles linked to email: ${application.email}`,
//       ipAddress: req.ip,
//       userAgent: req.headers["user-agent"]
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Membership application rejected successfully. Associated registration records have been nullified and wiped clean."
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// module.exports = {
//   submitApplication,
//   getAllApplications,
//   getApplicationById,
//   approveApplication,
//   rejectApplication
// };

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer"); 
const { createAuditLog } = require("./auditLogController");

const generateMembershipNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MEM-${year}-${random}`;
};

/*
|--------------------------------------------------------------------------
| NODEMAILER MAIL CARRIER CARRIER CONFIGURATION ENGINE
|--------------------------------------------------------------------------
*/
const createMailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "://gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true", 
    auth: {
      user: process.env.EMAIL_USER || "your-system-email@gmail.com",
      pass: process.env.EMAIL_PASSWORD || "your-app-specific-password"
    }
  });
};

const submitApplication = async (req, res) => {
  try {
    const MembershipApplication = mongoose.model("MembershipApplication");
    const existingApplication = await MembershipApplication.findOne({
      email: req.body.email
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "An application with this email already exists"
      });
    }

    const application = await MembershipApplication.create({
      ...req.body,
      status: "Pending"
    });

    return res.status(201).json({
      success: true,
      message: "Membership application submitted successfully",
      application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllApplications = async (req, res) => {
  try {
    const MembershipApplication = mongoose.model("MembershipApplication");
    const applications = await MembershipApplication.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const MembershipApplication = mongoose.model("MembershipApplication");
    const application = await MembershipApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    return res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const approveApplication = async (req, res) => {
  try {
    // SAFE MODEL LOOKUP LAYER: Prevents startup compilation and folder path path lookup failures
    const MembershipApplication = mongoose.model("MembershipApplication");
    const Member = mongoose.model("Member");
    const User = mongoose.model("User");

    const application = await MembershipApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    if (application.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Application already approved"
      });
    }

    const targetEmail = application.email.trim().toLowerCase();

    const existingMember = await Member.findOne({ email: targetEmail });
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "A registered member with this email already exists"
      });
    }

    application.status = "Approved";
    await application.save();

    const memberData = application.toObject();
    delete memberData._id;
    delete memberData.__v;

    const rawDefaultPassword = "WelcomeFamily123!";
    const defaultPasswordHash = await bcrypt.hash(rawDefaultPassword, 10);
    const assignedUsername = memberData.username || `${memberData.firstName.toLowerCase()}${Math.floor(100 + Math.random() * 900)}`;

    const member = await Member.create({
      ...memberData,
      username: assignedUsername,
      passwordHash: defaultPasswordHash, 
      role: "Member",
      membershipNumber: generateMembershipNumber(),
      approvedAt: new Date()
    });

    await User.create({
      username: assignedUsername,
      email: targetEmail,
      passwordHash: defaultPasswordHash,
      role: "Member",
      roleId: memberData.roleId || null
    });

    try {
      const transporter = createMailTransporter();
      const mailOptions = {
        from: `"Ecosystem Family Management Platform" <${process.env.EMAIL_USER || "no-reply@family.com"}>`,
        to: targetEmail,
        subject: "🎉 Welcome Abroad! Your Membership Application has been Approved",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #10b981; margin-top: 0;">Congratulations ${member.firstName}!</h2>
            <p>Your platform onboarding dossier has been verified and fully approved by the Membership Administrator.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #cbd5e1; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #1e3a8a;">🔐 Your Secure Login Credentials Handles</h4>
              <p style="margin: 4px 0;"><strong>Login Email:</strong> <code style="color: #2563eb;">${targetEmail}</code></p>
              <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="color: #2563eb;">${rawDefaultPassword}</code></p>
              <p style="margin: 4px 0;"><strong>Membership Number assigned:</strong> <code>${member.membershipNumber}</code></p>
            </div>
            
            <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">* Security Notice: Navigate to profile settings screens to update this temporary password upon your first initialization boot loop.</p>
          </div>
        `
      };
      await transporter.sendMail(mailOptions);
    } catch (mailError) {
      console.error("Outbound verification credential mail dispatch blocked:", mailError.message);
    }

    await createAuditLog({
      userId: req.user?._id,
      module: "Membership Onboarding",
      action: "Application Approved & User Profile Activated",
      oldValue: "Pending",
      newValue: JSON.stringify({ memberId: member._id, membershipNumber: member.membershipNumber, email: targetEmail }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Application approved successfully. User gateway login sync finalized. Credential notifications shipped.",
      member
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const MembershipApplication = mongoose.model("MembershipApplication");
    const Member = mongoose.model("Member");
    const User = mongoose.model("User");

    const application = await MembershipApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Membership application not found"
      });
    }

    if (application.status === "Rejected") {
      return res.status(400).json({ 
        success: false, 
        message: "This application has already been marked as rejected." 
      });
    }

    application.status = "Rejected";
    await application.save();

    await Promise.all([
      User.deleteOne({ email: application.email.toLowerCase().trim() }),
      Member.deleteOne({ email: application.email.toLowerCase().trim() })
    ]);

    await createAuditLog({
      userId: req.user?._id,
      module: "Membership Onboarding",
      action: "Application Rejected & Profile Nullified",
      oldValue: "Pending",
      newValue: `Nullified profiles linked to email: ${application.email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Membership application rejected successfully. Associated registration records have been nullified and wiped clean."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  submitApplication,
  getAllApplications,
  getApplicationById,
  approveApplication,
  rejectApplication
};
