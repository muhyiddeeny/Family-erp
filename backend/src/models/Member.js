const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
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

    personalPhoneNumber: String,
    officePhoneNumber: String,
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    homeCountry: String,
    residentCountry: String,
    residentialAddress: String,
    state: String,
    localGovernmentArea: String,
    ward: String,
    pollingUnit: String,

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

    kaida: { type: Boolean, default: false },
    alkhdari: { type: Boolean, default: false },
    ishmawi: { type: Boolean, default: false },
    iziyya: { type: Boolean, default: false },
    kurdubi: { type: Boolean, default: false },
    mukhtasar: { type: Boolean, default: false },

    numberOfJuzMemorized: { type: Number, default: 0 },
    numberOfJuzWritten: { type: Number, default: 0 },

    occupationCategory: String,
    occupationDescription: String,
    workExperience: String,

    favoriteActivity: String,
    presentActivityInformation: String,

    disabilityType: String,
    medicalTreatment: String,
    disabilityDuration: String,

    maritalStatus: String,
    spouseInformation: String,
    spouseUsername: {
      type: String,
      trim: true,
      default: ""
    },
    numberOfChildren: { type: Number, default: 0 },

    religion: String,
    tribe: String,
    nationality: String,
    wasiyyaDetails: String,
    opportunityInterest: String,

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
