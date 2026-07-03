const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    // 1. SYSTEM SECURITY & CREDENTIAL ACCESS LAYER (Fixes profile lockout bug)
    username: {
      type: String,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true // Enforces structural password tracking data availability
    },
    role: {
      type: String,
      enum: ["SuperAdmin", "MembershipAdmin", "BusinessAdmin", "DonationAdmin", "HouseAdmin", "Member"],
      default: "Member"
    },

    // 2. PERSONAL INFORMATION
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    middleName: {
      type: String,
      default: ""
    },
    surname: {
      type: String,
      required: true,
      trim: true
    },
    nickname: {
      type: String,
      default: ""
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    placeOfBirth: String,
    familyName: String,
    relationToFamily: String,
    passportPhoto: String, // Synchronized with your frontend forms variable name keys

    // 3. CONTACT INFORMATION
    personalPhoneNumber: String,
    officePhoneNumber: String,
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    // 4. LOCATION INFORMATION
    homeCountry: String,
    residentCountry: String,
    residentialAddress: String,
    state: String,
    localGovernmentArea: String,
    ward: String,
    pollingUnit: String,

    // 5. EDUCATIONAL INFORMATION
    nurserySchool: String,
    primarySchool: String,
    juniorSecondarySchool: String,
    seniorSecondarySchool: String,
    diploma: String,
    nce: String,
    hnd: String,
    degree: String,
    pgdPgdp: String,
    masters: String,
    phd: String,
    institutionName: String,
    faculty: String,
    department: String,
    courseOfStudy: String,
    levelOfStudy: String,

    // 6. ISLAMIC KNOWLEDGE INFORMATION (Enforces booleans matching your analytics controllers)
    kaida: { type: Boolean, default: false },
    alkhdari: { type: Boolean, default: false },
    ishmawi: { type: Boolean, default: false },
    iziyya: { type: Boolean, default: false },
    kurdubi: { type: Boolean, default: false },
    mukhtasar: { type: Boolean, default: false },

    // 7. QURANIC METRICS
    numberOfJuzMemorized: { type: Number, default: 0 },
    numberOfJuzWritten: { type: Number, default: 0 },

    // 8. OCCUPATION & EMPLOYMENT BACKGROUND
    occupationCategory: String,
    occupationDescription: String,
    workExperience: String,

    // 9. GUIDANCE INFORMATION
    favoriteActivity: String,
    presentActivityInformation: String,

    // 10. DISABILITY DATA
    disabilityType: String,
    medicalTreatment: String,
    disabilityDuration: String,

    // 11. MARITAL INFRASTRUCTURE
    maritalStatus: String,
    spouseInformation: String,
    numberOfChildren: { type: Number, default: 0 },

    // 12. DEMOGRAPHICS & LEGAL WRAPPERS
    religion: String,
    tribe: String,
    nationality: String,
    wasiyyaDetails: String,
    opportunityInterest: String,

    // 13. RELATIONAL ACCESS SYSTEM REFERENCES
    houseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "House",
      default: null
    },
    membershipNumber: {
      type: String,
      unique: true
    },
    approvedAt: Date
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Member", memberSchema);
