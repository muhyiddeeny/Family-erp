// const mongoose = require("mongoose");

// const houseSchema = new mongoose.Schema(
//   {
//     // SUPPORT BOTH FIELD LOGICS: Bypasses your strict old collection name index locks smoothly
//     name: {
//       type: String,
//       trim: true,
//       default: function() {
//         return this.houseName || "Unnamed Family House Hub";
//       }
//     },

//     houseName: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true
//     },

//     description: {
//       type: String,
//       default: ""
//     },

//     whatsappCommunityLink: {
//       type: String,
//       default: ""
//     },

//     members: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Member"
//       }
//     ]
//   },
//   {
//     timestamps: true
//   }
// );

// // Pre-save validation layer: Ensures both name shapes mirror each other identically before writing to MongoDB Atlas
// houseSchema.pre("save", function(next) {
//   if (this.houseName && !this.name) {
//     this.name = this.houseName;
//   }
//   if (this.name && !this.houseName) {
//     this.houseName = this.name;
//   }
//   next();
// });

// module.exports = mongoose.model("House", houseSchema);




const mongoose = require("mongoose");

const houseSchema = new mongoose.Schema(
  {
    // Kept flexible to match whichever key your frontend form sends
    name: {
      type: String,
      trim: true
    },

    // Removed 'unique: true' to prevent strict database indexing locks from crashing your creation
    houseName: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    whatsappCommunityLink: {
      type: String,
      default: ""
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member"
      }
    ]
  },
  {
    timestamps: true
  }
);

// Unified Pre-save Layer: Safely synchronizes 'name' and 'houseName'
// This ensures that no matter what your frontend form names the field, the database records it seamlessly.
houseSchema.pre("save", function(next) {
  // If houseName was provided but name is empty, sync them
  if (this.houseName && !this.name) {
    this.name = this.houseName;
  }
  // If name was provided but houseName is empty, sync them
  if (this.name && !this.houseName) {
    this.houseName = this.name;
  }
  
  // Fallback default if absolutely nothing was typed in the name inputs
  if (!this.name && !this.houseName) {
    this.name = "Unnamed Family House Hub";
    this.houseName = "Unnamed Family House Hub";
  }

  next();
});

module.exports = mongoose.model("House", houseSchema);
