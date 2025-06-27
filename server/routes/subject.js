const express = require("express");
const router = express.Router();
const { Subject, Room, Faculty } = require("../models");
const { auth, adminOnly } = require("../middleware/auth");

router.post("/room/:roomId", [auth, adminOnly], async (req, res) => {
  const { roomId } = req.params;
  const { name, time, noOfClassesPerWeek, facultyIds, isSpecial } = req.body;
  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const faculty = await Faculty.find({ facultyId: { $in: facultyIds } });
    if (faculty.length !== facultyIds.length)
      return res.status(400).json({ message: "One or more faculty not found" });
    const invalidFaculty = faculty.find((f) => !f.room.equals(room._id));
    if (invalidFaculty)
      return res
        .status(400)
        .json({ message: "Faculty must be assigned to the same room" });
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
    const room = await Room.findById({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const subject = await Subject.findById(id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    if (!subject.room.equals(room._id))
      return res
        .status(400)
        .json({ message: "Subject not assigned to this room" });
    let faculty = [];
    if (facultyIds) {
      faculty = await Faculty.find({ facultyId: { $in: facultyIds } });
      if (faculty.length !== facultyIds.length)
        return res
          .status(400)
          .json({ message: "One or more faculty not found" });
      const invalidFaculty = faculty.find((f) => !f.room.equals(room._id));
      if (invalidFaculty)
        return res
          .status(400)
          .json({ message: "Faculty must be assigned to the same room" });
    }
    const updateData = {
      name,
      time,
      noOfClassesPerWeek,
      isSpecial,
      updatedAt: Date.now(),
    };
    if (facultyIds) updateData.faculty = faculty.map((f) => f._id);
    const updatedSubject = await Subject.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("faculty");
    res.json({ message: "Subject updated", subject: updatedSubject });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const room = await Room.findById({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const subject = await Subject.findById(id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    if (!subject.room.equals(room._id))
      return res
        .status(400)
        .json({ message: "Subject not assigned to this room" });
    await Room.findByIdAndUpdate(room._id, {
      $pull: { subjects: subject._id },
    });
    await subject.deleteOne();
    res.json({ message: "Subject deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
