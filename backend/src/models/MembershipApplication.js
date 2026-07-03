const mongoose = require("mongoose");

const membershipApplicationSchema = new mongoose.Schema(
  {
    // 1. PERSONAL INFORMATION
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
    placeOfBirth: {
      type: String,
      default: ""
    },
    familyName: {
      type: String,
      default: ""
    },
    relationToFamily: {
      type: String,
      default: ""
    },
    passportPhoto: { // FIXED LAYER: Synchronized property name variable with your frontend forms
      type: String,
      default: ""
    },

    // 2. CONTACT INFORMATION
    personalPhoneNumber: {
      type: String,
      required: true
    },
    officePhoneNumber: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // 3. LOCATION INFORMATION
    homeCountry: {
      type: String,
      default: ""
    },
    residentCountry: {
      type: String,
      default: ""
    },
    residentialAddress: {
      type: String,
      default: ""
    },
    state: {
      type: String,
      default: ""
    },
    localGovernmentArea: {
      type: String,
      default: ""
    },
    ward: {
      type: String,
      default: ""
    },
    pollingUnit: {
      type: String,
      default: ""
    },

    // 4. EDUCATIONAL INFORMATION
    nurserySchool: { type: String, default: "" },
    primarySchool: { type: String, default: "" },
    juniorSecondarySchool: { type: String, default: "" },
    seniorSecondarySchool: { type: String, default: "" },
    diploma: { type: String, default: "" },
    nce: { type: String, default: "" },
    hnd: { type: String, default: "" },
    degree: { type: String, default: "" },
    pgdPgdp: { type: String, default: "" },
    masters: { type: String, default: "" },
    phd: { type: String, default: "" },
    institutionName: { type: String, default: "" },
    faculty: { type: String, default: "" },
    department: { type: String, default: "" },
    courseOfStudy: { type: String, default: "" },
    levelOfStudy: { type: String, default: "" },
    graduationYear: { type: String, default: "" }, // Added missing field matching frontend batch 3

    // 5. ISLAMIC & QURANIC PARAMETERS (Ensures flexible processing strings matching your fields)
    islamicEducation: { type: String, default: "" },
    quranKnowledge: { type: String, default: "" },
    kaida: { type: Boolean, default: false },
    alkhdari: { type: Boolean, default: false },
    ishmawi: { type: Boolean, default: false },
    iziyya: { type: Boolean, default: false },
    kurdubi: { type: Boolean, default: false },
    mukhtasar: { type: Boolean, default: false },
    numberOfJuzMemorized: { type: Number, default: 0 },
    numberOfJuzWritten: { type: Number, default: 0 },

    // 6. OCCUPATION INFORMATION (FIXED LAYER: Swapped rigid enum with standard string for user input safety)
    occupationCategory: { type: String, default: "" }, 
    occupation: { type: String, default: "" }, // Added text mapping field matching frontend batch 4
    occupationDescription: { type: String, default: "" },
    workplace: { type: String, default: "" }, // Added missing workplace field
    workExperience: { type: String, default: "" },

    // 7. GUIDANCE & HEALTH DETAILS
    favoriteActivity: { type: String, default: "" },
    presentActivityInformation: { type: String, default: "" },
    disabilityStatus: { type: String, default: "" }, // Added missing status field
    disabilityType: { type: String, default: "" },
    disabilityDetails: { type: String, default: "" }, // Added missing details field
    medicalTreatment: { type: String, default: "" },
    disabilityDuration: { type: String, default: "" },

    // 8. FAMILY & MARITAL SPECIFICATIONS
    maritalStatus: { type: String, default: "Single" },
    spouseInformation: { type: String, default: "" },
    numberOfChildren: { type: Number, default: 0 },
    religion: { type: String, default: "" },
    tribe: { type: String, default: "" },
    nationality: { type: String, default: "" },

    // 9. WASIYYA & OPPORTUNITY PLACEMENT DATA
    wasiyyaDetails: { type: String, default: "" },
    opportunityInterest: { type: String, default: "" },

    // 10. ONBOARDING REGISTRATION MONITOR
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("MembershipApplication", membershipApplicationSchema);
