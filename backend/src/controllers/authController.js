// const bcrypt = require("bcryptjs");
// const User = require("../models/User");
// const generateToken = require("../utils/generateToken");

// /*
// |--------------------------------------------------------------------------
// | REGISTER
// |--------------------------------------------------------------------------
// */
// const register = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     if (!username || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required"
//       });
//     }

//     const existingUser = await User.findOne({
//       $or: [{ email }, { username }]
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists"
//       });
//     }

//     const passwordHash = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       username,
//       email,
//       passwordHash,
//       role: "Member"
//     });

//     const token = generateToken(user);

//     return res.status(201).json({
//       success: true,
//       message: "Account created successfully",
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         role: user.role
//       }
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// /*
// |--------------------------------------------------------------------------
// | LOGIN
// |--------------------------------------------------------------------------
// */
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email and password are required"
//       });
//     }

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password"
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.passwordHash);

//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password"
//       });
//     }

//     user.lastLoginAt = new Date();
//     await user.save();

//     const token = generateToken(user);

//     return res.status(200).json({
//       success: true,
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         role: user.role
//       }
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// /*
// |--------------------------------------------------------------------------
// | GET CURRENT USER
// |--------------------------------------------------------------------------
// */
// const getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).select("-passwordHash");

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       user
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// module.exports = {
//   register,
//   login,
//   getMe
// };

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role"); // FIXED LAYER: Import the Role model to fetch relational pointer ids
const generateToken = require("../utils/generateToken");

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/
const register = async (req, res) => {
  try {
    // FIXED LAYER: Extract the custom role attribute sent from the administrator form payload
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    // FIXED LAYER: Read incoming choices, otherwise fallback safely to a default family member role string
    const targetRoleName = role || "Member";
    let roleDocument = await Role.findOne({ name: targetRoleName });

    // FIXED LAYER: If the target role document does not exist yet on a fresh cluster shard, create it on the fly
    if (!roleDocument) {
      roleDocument = await Role.create({
        name: targetRoleName,
        description: `Automated dynamic level assignment for ${targetRoleName} system operators.`
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // FIXED LAYER: Map both the custom string name and the database objectId link to the new account document
    const user = await User.create({
      username,
      email,
      passwordHash,
      role: targetRoleName,
      roleId: roleDocument._id
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
