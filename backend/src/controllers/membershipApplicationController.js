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
const express = require("express");
const mongoose = require("mongoose"); // FIXED IMPORT: Provides safe database cache checks
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer"); 
const { createAuditLog } = require("./auditLogController");

const generateMembershipNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MEM-${year}-${random}`;
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
    // FIXED CACHE LOOKUPS: Pulls loaded schemas directly to stop folder import boot crashes
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

    // TWO-FACTOR AUTH SYSTEM PROFILE REGISTRATION: Creates active security user login credentials
    await User.create({
      username: assignedUsername,
      email: targetEmail,
      passwordHash: defaultPasswordHash,
      role: "Member"
    });

    // AUTOMATED SYSTEM NOTIFICATION CARRIER EMAIL Dispatches credentials containing raw default password
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "://gmail.com",
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: `"Ecosystem Family Platform" <${process.env.EMAIL_USER}>`,
        to: targetEmail,
        subject: "🎉 Welcome! Your Membership Application has been Approved",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #334155; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #10b981; margin-top: 0;">Congratulations!</h3>
            <p>Your membership profile registration file has been successfully verified and approved.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #cbd5e1; margin: 15px 0;">
              <strong>🔐 Account Login Credentials Details:</strong>
              <p style="margin: 6px 0 0 0;"><strong>Login Email Address:</strong> ${targetEmail}</p>
              <p style="margin: 4px 0 0 0;"><strong>Temporary Password String:</strong> ${rawDefaultPassword}</p>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">* Security Notice: Update this temporary password inside your setting panels on your first session login boot loop.</p>
          </div>
        `
      });
    } catch (mailError) {
      console.error("Outbound email failed to transmit:", mailError.message);
    }

    await createAuditLog({
      userId: req.user?._id,
      module: "Membership Onboarding",
      action: "Application Approved",
      oldValue: "Pending",
      newValue: JSON.stringify({ memberId: member._id, membershipNumber: member.membershipNumber, email: targetEmail }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Application approved successfully. User account activated.",
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
