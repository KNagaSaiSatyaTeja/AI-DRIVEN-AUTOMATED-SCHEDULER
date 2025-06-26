const express = require("express");
const router = express.Router();
const { Faculty, Room } = require("../models");
const { auth, adminOnly } = require("../middleware/auth");

router.post("/room/:roomId", [auth, adminOnly], async (req, res) => {
  const { roomId } = req.params;
  const { facultyId, name, availability } = req.body;
  try {
    console.log("Received request body:", req.body); // Debug request body
    if (!name) {
      return res.status(400).json({ message: "Faculty name is required" });
    }
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    // Validate or generate facultyId
    const finalFacultyId =
      facultyId || `FAC_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    // Check for existing faculty with the same facultyId or name
    const existingFacultyById = await Faculty.findOne({
      facultyId: finalFacultyId,
    });
    if (existingFacultyById) {
      return res
        .status(400)
        .json({ message: "Faculty with this facultyId already exists" });
    }
    const existingFacultyByName = await Faculty.findOne({ name });
    if (existingFacultyByName) {
      return res
        .status(400)
        .json({ message: "Faculty with this name already exists" });
    }
    const faculty = new Faculty({
      facultyId: finalFacultyId,
      name,
      room: room._id,
      availability,
    });
    await faculty.save();
    await Room.findByIdAndUpdate(room._id, { $push: { faculty: faculty._id } });
    res.status(201).json({
      message: "Faculty created",
      faculty: {
        _id: faculty._id,
        facultyId: finalFacultyId,
        name,
        roomId,
        availability,
      },
    });
  } catch (error) {
    console.error("Error creating faculty:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/room/:roomId", auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    console.log("Fetching faculty for room:", roomId);
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const faculty = await Faculty.find({ room: room._id }).select(
      "facultyId name availability createdAt updatedAt"
    );
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/room/:roomId/:id", [auth, adminOnly], async (req, res) => {
  const { roomId, id } = req.params;
  const { facultyId, name, availability } = req.body;
  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const faculty = await Faculty.findById(id);
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    if (!faculty.room.equals(room._id))
      return res
        .status(400)
        .json({ message: "Faculty not assigned to this room" });
    // Validate new facultyId if provided
    const finalFacultyId = facultyId || faculty.facultyId;
    if (facultyId && facultyId !== faculty.facultyId) {
      const existingFacultyById = await Faculty.findOne({
        facultyId: finalFacultyId,
      });
      if (existingFacultyById && existingFacultyById._id.toString() !== id) {
        return res
          .status(400)
          .json({ message: "Faculty with this facultyId already exists" });
      }
    }
    // Check for duplicate name (excluding the current faculty)
    if (name && name !== faculty.name) {
      const existingFacultyByName = await Faculty.findOne({ name });
      if (
        existingFacultyByName &&
        existingFacultyByName._id.toString() !== id
      ) {
        return res
          .status(400)
          .json({ message: "Faculty with this name already exists" });
      }
    }
    const updatedFaculty = await Faculty.findByIdAndUpdate(
      id,
      { facultyId: finalFacultyId, name, availability, updatedAt: Date.now() },
      { new: true }
    );
    res.json({ message: "Faculty updated", faculty: updatedFaculty });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/room/:roomId/:id", [auth, adminOnly], async (req, res) => {
  const { roomId, id } = req.params;
  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const faculty = await Faculty.findById(id);
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    if (!faculty.room.equals(room._id))
      return res
        .status(400)
        .json({ message: "Faculty not assigned to this room" });
    await Room.findByIdAndUpdate(room._id, {
      $pull: { faculty: faculty._id },
    });
    await faculty.deleteOne();
    res.json({ message: "Faculty deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
