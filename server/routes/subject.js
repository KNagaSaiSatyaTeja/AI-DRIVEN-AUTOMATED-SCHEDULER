const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Subject, Room, Faculty } = require("../models");
const { auth, adminOnly } = require("../middleware/auth");

router.post("/room/:roomId", [auth, adminOnly], async (req, res) => {
  const { roomId } = req.params;
  const { name, time, noOfClassesPerWeek, facultyIds, isSpecial } = req.body;
  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const faculty = await Faculty.find({ _id: { $in: facultyIds } });

    // FIX: Convert ObjectIds to strings for comparison
    const foundIds = faculty.map((f) => f._id.toString());
    const missingIds = facultyIds.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      return res.status(400).json({
        message: "Faculty not found",
        missingIds,
      });
    }

    // Check if all faculty are assigned to the same room
    const invalidFaculty = faculty.find((f) => !f.room.equals(room._id));
    if (invalidFaculty) {
      return res
        .status(400)
        .json({ message: "Faculty must be assigned to the same room" });
    }

    const subject = new Subject({
      name,
      time,
      noOfClassesPerWeek,
      room: room._id,
      faculty: faculty.map((f) => f._id),
      isSpecial,
    });
    await subject.save();
    await Room.findByIdAndUpdate(room._id, {
      $push: { subjects: subject._id },
    });
    res.status(201).json({ message: "Subject created", subject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/room/:roomId", auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    console.log("Fetching subjects for room:", roomId);
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const subjects = await Subject.find({ room: room._id })
      .populate("faculty")
      .select(
        "name time noOfClassesPerWeek faculty isSpecial createdAt updatedAt"
      );
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/room/:roomId/:id", [auth, adminOnly], async (req, res) => {
  const { roomId, id } = req.params;
  const { name, time, noOfClassesPerWeek, facultyIds, isSpecial } = req.body;

  try {
    // Validate roomId and id as valid ObjectIds
    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid roomId format" });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid subject id format" });
    }

    // Find the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Find the subject
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if subject is assigned to the room
    if (!subject.room.equals(room._id)) {
      return res
        .status(400)
        .json({ message: "Subject not assigned to this room" });
    }

    // Validate and fetch faculty if provided
    let faculty = [];
    if (facultyIds && facultyIds.length > 0) {
      if (!Array.isArray(facultyIds)) {
        return res.status(400).json({ message: "facultyIds must be an array" });
      }

      // Validate each facultyId
      for (const facultyId of facultyIds) {
        
        if (!mongoose.isValidObjectId(facultyId)) {
          return res
            .status(400)
            .json({ message: `Invalid facultyId: ${facultyId}` });
        }
      }

      faculty = await Faculty.find({ _id: { $in: facultyIds } });
      if (faculty.length !== facultyIds.length) {
        return res
          .status(400)
          .json({ message: "One or more faculty not found" });
      }

      // Check if all faculty are assigned to the same room
      const invalidFaculty = faculty.find((f) => !f.room.equals(room._id));
      if (invalidFaculty) {
        return res
          .status(400)
          .json({ message: "Faculty must be assigned to the same room" });
      }
    }

    // Prepare update data - only include fields that are provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (time !== undefined) updateData.time = time;
    if (noOfClassesPerWeek !== undefined)
      updateData.noOfClassesPerWeek = noOfClassesPerWeek;
    if (isSpecial !== undefined) updateData.isSpecial = isSpecial;
    if (facultyIds !== undefined)
      updateData.faculty = faculty.map((f) => f._id);

    updateData.updatedAt = new Date();

    // Update the subject
    const updatedSubject = await Subject.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("faculty");
    console.log("Updated subject:", updatedSubject);

    res.json({ message: "Subject updated", subject: updatedSubject });
  } catch (error) {
    console.error("PUT /room/:roomId/:id error:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: `Invalid ID format: ${error.message}` });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error updating subject:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", [auth], async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate("room", "name")
      .populate("faculty", "name");
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/room/:roomId/:id", [auth, adminOnly], async (req, res) => {
  const { roomId, id } = req.params;
  try {
    // Validate ObjectIds
    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid roomId format" });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid subject id format" });
    }

    // Find the room - FIXED: was using { roomId } instead of roomId
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Find the subject
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if subject is assigned to the room
    if (!subject.room.equals(room._id)) {
      return res
        .status(400)
        .json({ message: "Subject not assigned to this room" });
    }

    // Remove subject from room's subjects array
    await Room.findByIdAndUpdate(room._id, {
      $pull: { subjects: subject._id },
    });

    // Delete the subject
    await Subject.findByIdAndDelete(id);

    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("DELETE /room/:roomId/:id error:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: `Invalid ID format: ${error.message}` });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
