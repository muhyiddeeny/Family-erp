const Member = require("../models/Member");

const getAllMembers = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | SECURITY & RELATION FILTER LAYER
    |--------------------------------------------------------------------------
    | Replaced the open select query with an explicit field protection chain.
    | Adding select("-passwordHash") ensures password hashes are never exposed.
    | Adding populate("houseId") links their community house data instantly.
    */
    const members = await Member.find()
      .select("-passwordHash")
      .populate("houseId", "houseName whatsappCommunityLink")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: members.length,
      members
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .select("-passwordHash")
      .populate("houseId", "houseName whatsappCommunityLink");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Family member profile document not found"
      });
    }

    return res.status(200).json({
      success: true,
      member
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllMembers,
  getMemberById
};
