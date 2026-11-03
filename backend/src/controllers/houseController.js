const House = require("../models/House");
const Member = require("../models/Member");

// Makes sure a saved WhatsApp link always opens correctly (adds https:// when missing)
const normalizeLink = (link) => {
  const text = String(link || "").trim();
  if (!text) return "";
  return /^https?:\/\//i.test(text) ? text : `https://${text.replace(/^\/+/, "")}`;
};

const createHouse = async (req, res) => {
  try {
    const finalHouseName = (req.body.houseName || req.body.name || req.body.title || "").trim();

    if (!finalHouseName) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: houseName is a required field."
      });
    }

    const house = await House.create({
      houseName: finalHouseName,
      description: req.body.description || "",
      whatsappCommunityLink: normalizeLink(
        req.body.whatsappCommunityLink || req.body.whatsAppGroupLink || req.body.whatsappLink
      ),
      status: req.body.status || "VACANT",
      members: []
    });

    return res.status(201).json({ success: true, house });
  } catch (error) {
    console.error("createHouse error:", error);
    const statusCode = error.name === "ValidationError" ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

const getAllHouses = async (req, res) => {
  try {
    let houses = await House.find().populate("members", "firstName surname email role");

    const userRole = req.user?.role;
    const isAdmin = userRole === "Admin" || userRole === "SuperAdmin" || userRole === "HouseAdmin";

    if (!isAdmin) {
      const targetMemberId = req.user?._id || req.query.memberId;
      let assignedHouseId = null;

      if (targetMemberId) {
        const memberProfile = await Member.findById(targetMemberId);
        assignedHouseId = memberProfile?.houseId?.toString();
      }

      houses = houses.map((house) => {
        const houseObj = house.toObject();
        if (!assignedHouseId || houseObj._id.toString() !== assignedHouseId) {
          delete houseObj.whatsappCommunityLink;
        }
        return houseObj;
      });
    }

    return res.status(200).json({ success: true, count: houses.length, houses });
  } catch (error) {
    console.error("getAllHouses error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateHouse = async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== "SuperAdmin" && userRole !== "Admin" && userRole !== "HouseAdmin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You do not have permission to update house properties."
      });
    }

    const updatePayload = {};
    const newName = (req.body.houseName || req.body.name || "").trim();
    if (newName) {
      updatePayload.houseName = newName;
      updatePayload.name = newName;
    }
    if (req.body.description !== undefined) updatePayload.description = req.body.description;
    const link = req.body.whatsappCommunityLink ?? req.body.whatsAppGroupLink ?? req.body.whatsappLink;
    if (link !== undefined) updatePayload.whatsappCommunityLink = normalizeLink(link);
    if (req.body.status) updatePayload.status = req.body.status;

    const house = await House.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true
    });

    if (!house) {
      return res.status(404).json({ success: false, message: "Target house entity record not found." });
    }
    return res.status(200).json({ success: true, house });
  } catch (error) {
    console.error("updateHouse error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteHouse = async (req, res) => {
  try {
    const houseId = req.params.id;
    await Member.updateMany({ houseId }, { $unset: { houseId: "" } });
    await House.findByIdAndDelete(houseId);
    return res.status(200).json({
      success: true,
      message: "House deleted successfully and associated member links cleared"
    });
  } catch (error) {
    console.error("deleteHouse error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const assignMemberToHouse = async (req, res) => {
  try {
    const { memberId } = req.body;
    const targetHouseId = req.params.id;
    const house = await House.findById(targetHouseId);
    const member = await Member.findById(memberId);
    if (!house || !member) {
      return res.status(404).json({ success: false, message: "House or Member not found" });
    }
    if (member.houseId && member.houseId.toString() !== targetHouseId) {
      await House.findByIdAndUpdate(member.houseId, { $pull: { members: member._id } });
    }
    member.houseId = house._id;
    await member.save();
    if (!house.members.includes(member._id)) {
      house.members.push(member._id);
      await house.save();
    }
    return res.status(200).json({
      success: true,
      message: "Member assigned successfully and old house balances reconciled"
    });
  } catch (error) {
    console.error("assignMemberToHouse error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createHouse,
  getAllHouses,
  updateHouse,
  deleteHouse,
  assignMemberToHouse
};
