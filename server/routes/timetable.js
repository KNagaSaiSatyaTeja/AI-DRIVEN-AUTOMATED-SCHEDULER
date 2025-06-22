const express = require("express");
const router = express.Router();
const { Timetable } = require("../models");
const { auth, adminOnly } = require("../middleware/auth");
const axios = require("axios");

const FASTAPI_URL = "http://127.0.0.1:8000";

router.post("/generate", auth, async (req, res) => {
  const { subjects, break_, college_time, rooms } = req.body;
  try {
    const fastapiResponse = await axios.post(
      `${FASTAPI_URL}/api/generate-schedule`,
      {
        subjects,
        break_: break_,
        college_time,
        rooms,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    const { schedule, ...timetableData } = fastapiResponse.data;
    const timetable = new Timetable({
      subjects,
      breaks: break_,
      collegeTime: college_time,
      rooms,
      schedule,
    });
    await timetable.save();
    res.status(201).json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const timetables = await Timetable.find();
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", [auth, adminOnly], async (req, res) => {
  const { id } = req.params;
  const { subjects, breaks, collegeTime, rooms, schedule } = req.body;
  try {
    const timetable = await Timetable.findByIdAndUpdate(
      id,
      { subjects, breaks, collegeTime, rooms, schedule, updatedAt: Date.now() },
      { new: true }
    );
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
