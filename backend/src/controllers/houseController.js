// const House = require("../models/House");
// const Member = require("../models/Member");

// const createHouse = async (req, res) => {
//   try {
//     const house = await House.create(req.body);
//     return res.status(201).json({
//       success: true,
//       house
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const getAllHouses = async (req, res) => {
//   try {
//     // 1. Fetch houses from the database
//     let houses = await House.find().populate("members", "firstName surname email role");

//     // 2. PRIVACY ENFORCEMENT LAYER: FIXED to explicitly include HouseAdmin alongside Admin and SuperAdmin
//     const userRole = req.user?.role;
//     const isAdmin = userRole === "Admin" || userRole === "SuperAdmin" || userRole === "HouseAdmin";

//     if (!isAdmin) {
//       // Find the explicit house id assigned to this logged-in member
//       const memberProfile = await Member.findById(req.user?._id || req.query.memberId);
//       const assignedHouseId = memberProfile?.houseId?.toString();

//       houses = houses.map(house => {
//         const houseObj = house.toObject();
//         // If it's not their assigned house, strip the private WhatsApp community link entirely
//         if (houseObj._id.toString() !== assignedHouseId) {
//           delete houseObj.whatsappLink; 
//         }
//         return houseObj;
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       count: houses.length,
//       houses
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const updateHouse = async (req, res) => {
//   try {
//     // 3. ROLE COMPATIBILITY LAYER: Explicitly confirm client token payload role permission before mutating fields
//     const userRole = req.user?.role;
//     if (userRole !== "SuperAdmin" && userRole !== "Admin" && userRole !== "HouseAdmin") {
//       return res.status(403).json({
//         success: false,
//         message: "Access Denied: You do not have permission to update house properties."
//       });
//     }

//     const house = await House.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );

//     if (!house) {
//       return res.status(404).json({
//         success: false,
//         message: "Target house entity record not found."
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       house
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const deleteHouse = async (req, res) => {
//   try {
//     const houseId = req.params.id;

//     // Remove house reference from all members who belong to this deleted house
//     await Member.updateMany({ houseId }, { $unset: { houseId: "" } });

//     await House.findByIdAndDelete(houseId);

//     return res.status(200).json({
//       success: true,
//       message: "House deleted successfully and associated member links cleared"
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const assignMemberToHouse = async (req, res) => {
//   try {
//     const { memberId } = req.body;
//     const targetHouseId = req.params.id;

//     const house = await House.findById(targetHouseId);
//     const member = await Member.findById(memberId);

//     if (!house || !member) {
//       return res.status(404).json({
//         success: false,
//         message: "House or Member not found"
//       });
//     }

//     // FIXED RELATIONSHIP LAYER: Remove member from their previous house array list if it exists
//     if (member.houseId && member.houseId.toString() !== targetHouseId) {
//       await House.findByIdAndUpdate(member.houseId, {
//         $pull: { members: member._id }
//       });
//     }

//     // Update the Member's internal house target pointer link reference
//     member.houseId = house._id;
//     await member.save();

//     // Add Member to the new target house array securely without duplication collisions
//     if (!house.members.includes(member._id)) {
//       house.members.push(member._id);
//       await house.save();
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Member assigned successfully and old house balances reconciled"
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// module.exports = {
//   createHouse,
//   getAllHouses,
//   updateHouse,
//   deleteHouse,
//   assignMemberToHouse
// };

const House = require("../models/House"); 
const Member = require("../models/Member"); 

const createHouse = async (req, res) => { 
  try { 
    // Fallback extraction to ensure we capture the string no matter what key frontend sends
    const finalHouseName = req.body.houseName || req.body.name || req.body.title;

    if (!finalHouseName || finalHouseName.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "Validation Error: houseName is a required field." 
      });
    }

    const housePayload = {
      houseName: finalHouseName.trim(), // Matches your database schema rule perfectly
      whatsappLink: req.body.whatsappLink || req.body.whatsAppGroupLink || "",
      status: req.body.status || "VACANT", 
      members: [] 
    };

    const house = await House.create(housePayload); 
    return res.status(201).json({ success: true, house }); 
  } catch (error) { 
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
      
      houses = houses.map(house => { 
        const houseObj = house.toObject(); 
        if (!assignedHouseId || houseObj._id.toString() !== assignedHouseId) { 
          delete houseObj.whatsappLink; 
          delete houseObj.whatsAppGroupLink; 
        } 
        return houseObj; 
      }); 
    } 
    return res.status(200).json({ success: true, count: houses.length, houses }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const updateHouse = async (req, res) => { 
  try { 
    const userRole = req.user?.role; 
    if (userRole !== "SuperAdmin" && userRole !== "Admin" && userRole !== "HouseAdmin") { 
      return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to update house properties." }); 
    } 

    const updatePayload = { ...req.body };
    
    // Maintain alignment with your schema key if the frontend tries to update the name field
    if (req.body.name) {
      updatePayload.houseName = req.body.name;
    }
    if (req.body.whatsAppGroupLink) {
      updatePayload.whatsappLink = req.body.whatsAppGroupLink;
    }

    const house = await House.findByIdAndUpdate( 
      req.params.id, 
      updatePayload, 
      { new: true, runValidators: true } 
    ); 
    if (!house) { 
      return res.status(404).json({ success: false, message: "Target house entity record not found." }); 
    } 
    return res.status(200).json({ success: true, house }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const deleteHouse = async (req, res) => { 
  try { 
    const houseId = req.params.id; 
    await Member.updateMany({ houseId }, { $unset: { houseId: "" } }); 
    await House.findByIdAndDelete(houseId); 
    return res.status(200).json({ success: true, message: "House deleted successfully and associated member links cleared" }); 
  } catch (error) { 
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
    return res.status(200).json({ success: true, message: "Member assigned successfully and old house balances reconciled" }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

module.exports = { createHouse, getAllHouses, updateHouse, deleteHouse, assignMemberToHouse };
