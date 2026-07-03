const House = require("../models/House");
const Member = require("../models/Member");

const createHouse = async (req, res) => {
  try {
    const house = await House.create(req.body);
    return res.status(201).json({
      success: true,
      house
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllHouses = async (req, res) => {
  try {
    // 1. Fetch houses from the database
    let houses = await House.find().populate("members", "firstName surname email role");

    // 2. PRIVACY ENFORCEMENT LAYER: Hide WhatsApp links if the user is not an Admin or SuperAdmin
    const userRole = req.user?.role;
    const isAdmin = userRole === "Admin" || userRole === "SuperAdmin";

    if (!isAdmin) {
      // Find the explicit house id assigned to this logged-in member
      const memberProfile = await Member.findById(req.user?._id || req.query.memberId);
      const assignedHouseId = memberProfile?.houseId?.toString();

      houses = houses.map(house => {
        const houseObj = house.toObject();
        // If it's not their assigned house, strip the private WhatsApp community link entirely
        if (houseObj._id.toString() !== assignedHouseId) {
          delete houseObj.whatsappLink; // Adjust key name to match your exact House schema field
        }
        return houseObj;
      });
    }

    return res.status(200).json({
      success: true,
      count: houses.length,
      houses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateHouse = async (req, res) => {
  try {
    const house = await House.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.status(200).json({
      success: true,
      house
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteHouse = async (req, res) => {
  try {
    const houseId = req.params.id;

    // Remove house reference from all members who belong to this deleted house
    await Member.updateMany({ houseId }, { $unset: { houseId: "" } });

    await House.findByIdAndDelete(houseId);

    return res.status(200).json({
      success: true,
      message: "House deleted successfully and associated member links cleared"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const assignMemberToHouse = async (req, res) => {
  try {
    const { memberId } = req.body;
    const targetHouseId = req.params.id;

    const house = await House.findById(targetHouseId);
    const member = await Member.findById(memberId);

    if (!house || !member) {
      return res.status(404).json({
        success: false,
        message: "House or Member not found"
      });
    }

    // 3. FIXED RELATIONSHIP LAYER: Remove member from their previous house array list if it exists
    if (member.houseId && member.houseId.toString() !== targetHouseId) {
      await House.findByIdAndUpdate(member.houseId, {
        $pull: { members: member._id }
      });
    }

    // 4. Update the Member's internal house target pointer link reference
    member.houseId = house._id;
    await member.save();

    // 5. Add Member to the new target house array securely without duplication collisions
    if (!house.members.includes(member._id)) {
      house.members.push(member._id);
      await house.save();
    }

    return res.status(200).json({
      success: true,
      message: "Member assigned successfully and old house balances reconciled"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createHouse,
  getAllHouses,
  updateHouse,
  deleteHouse,
  assignMemberToHouse
};
