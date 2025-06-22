const express = require("express");
const router = express.Router();
const { Room, Subject, Faculty } = require("../models");
const { auth, adminOnly } = require("../middleware/auth");

router.post("/", [auth, adminOnly], async (req, res) => {
  const { roomId, name, capacity } = req.body;
  try {
    const existingRoom = await Room.findOne({ roomId });
    if (existingRoom)
      return res.status(400).json({ message: "Room already exists" });
    const room = new Room({ roomId, name, capacity });
    await room.save();
    res
      .status(201)
      .json({ message: "Room created", room: { roomId, name, capacity } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate("subjects faculty")
      .select("roomId name capacity subjects faculty createdAt updatedAt");
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:roomId", auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findOne({ roomId })
      .populate("subjects faculty")
      .select("roomId name capacity subjects faculty createdAt updatedAt");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:roomId", [auth, adminOnly], async (req, res) => {
  const { roomId } = req.params;
  const { name, capacity } = req.body;
  try {
    const room = await Room.findOneAndUpdate(
      { roomId },
      { name, capacity, updatedAt: Date.now() },
      { new: true }
    ).populate("subjects faculty");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room updated", room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:roomId", [auth, adminOnly], async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const subjects = await Subject.find({ room: room._id });
    const faculty = await Faculty.find({ room: room._id });
    if (subjects.length > 0 || faculty.length > 0) {
      return res.status(400).json({
        message: "Cannot delete room with assigned subjects or faculty",
      });
    }
    await room.deleteOne();
    res.json({ message: "Room deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
