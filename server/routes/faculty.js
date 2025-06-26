const express = require("express");
const router = express.Router();
const { Faculty, Room } = require("../models");
const { auth, adminOnly } = require("../middleware/auth");

router.post("/room/:roomId", [auth, adminOnly], async (req, res) => {
  const { roomId } = req.params;
  const { facultyId, name, availability } = req.body;
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const existingFaculty = await Faculty.findOne({ facultyId });
    if (existingFaculty)
      return res.status(400).json({ message: "Faculty already exists" });
    const faculty = new Faculty({
      facultyId,
      name,
      room: room._id,
      availability,
    });
    await faculty.save();
    await Room.findByIdAndUpdate(room._id, { $push: { faculty: faculty._id } });
    res
      .status(201)
      .json({
        message: "Faculty created",
        faculty: { facultyId, name, roomId, availability },
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/room/:roomId", auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const faculty = await Faculty.find({ room: room._id }).select(
      "facultyId name availability createdAt updatedAt"
    );
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/room/:roomId/:facultyId", [auth, adminOnly], async (req, res) => {
  const { roomId, facultyId } = req.params;
  const { name, availability } = req.body;
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const faculty = await Faculty.findOne({ facultyId });
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    if (!faculty.room.equals(room._id))
      return res
        .status(400)
        .json({ message: "Faculty not assigned to this room" });
    const updatedFaculty = await Faculty.findOneAndUpdate(
      { facultyId },
      { name, availability, updatedAt: Date.now() },
      { new: true }
    );
    res.json({ message: "Faculty updated", faculty: updatedFaculty });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete(
  "/room/:roomId/:facultyId",
  [auth, adminOnly],
  async (req, res) => {
    const { roomId, facultyId } = req.params;
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return res.status(404).json({ message: "Room not found" });
      const faculty = await Faculty.findOne({ facultyId });
      if (!faculty)
        return res.status(404).json({ message: "Faculty not found" });
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
  }
);

module.exports = router;
