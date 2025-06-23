const express = require("express");
const router = express.Router();
const { Room, Subject, Faculty } = require("../models");
const { auth, adminOnly } = require("../middleware/auth");

router.post("/", [auth, adminOnly], async (req, res) => {
  const { name, capacity } = req.body;
  try {
    console.log("Received request body:", req.body); // Debug request body
    if (!name || !capacity) {
      return res
        .status(400)
        .json({ message: "Name and capacity are required" });
    }
    if (typeof capacity !== "number" || capacity <= 0) {
      return res
        .status(400)
        .json({ message: "Capacity must be a positive number" });
    }
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res
        .status(400)
        .json({ message: "Room with this name already exists" });
    }
    const room = new Room({ name, capacity });
    await room.save();
    res.status(201).json({
      message: "Room created",
      room: { _id: room._id, name, capacity },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate("subjects faculty")
      .select("_id name capacity subjects faculty createdAt updatedAt");
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    console.log("Fetching room with ID:", id);
    const room = await Room.findById(id)
      .populate("subjects faculty")
      .select("_id name capacity subjects faculty createdAt updatedAt");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:_id", [auth, adminOnly], async (req, res) => {
  const { _id } = req.params;
  const { name, capacity } = req.body;
  try {
    if (!name || capacity === undefined) {
      return res
        .status(400)
        .json({ message: "Name and capacity are required" });
    }
    if (typeof capacity !== "number" || capacity <= 0) {
      return res
        .status(400)
        .json({ message: "Capacity must be a positive number" });
    }
    const room = await Room.findByIdAndUpdate(
      _id,
      { name, capacity, updatedAt: Date.now() },
      { new: true }
    ).populate("subjects faculty");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room updated", room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:_id", [auth, adminOnly], async (req, res) => {
  const { _id } = req.params;
  try {
    const room = await Room.findById(_id);
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
