const express = require("express");
const router = express.Router();
const { Timetable, Room, Subject, Faculty } = require("../models");
const { auth, adminOnly } = require("../middleware/auth");
const axios = require("axios");

const FASTAPI_URL = "http://127.0.0.1:8000";

router.post("/room/:roomId/generate", [auth, adminOnly], async (req, res) => {
  const { roomId } = req.params;
  const { subjects, break_, collegeTime } = req.body;
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Validate subjects and faculty
    const subjectDocs = await Subject.find({
      _id: { $in: subjects.map((s) => s._id) },
    }).populate("faculty room");
    const subjectMap = new Map(subjectDocs.map((s) => [s._id.toString(), s]));
    for (const subject of subjects) {
      const subjectDoc = subjectMap.get(subject._id);
      if (!subjectDoc)
        return res
          .status(400)
          .json({ message: `Subject ${subject.name} not found` });
      if (!room._id.equals(subjectDoc.room)) {
        return res
          .status(400)
          .json({
            message: `Subject ${subject.name} not assigned to room ${roomId}`,
          });
      }
      const facultyDocs = await Faculty.find({
        facultyId: { $in: subject.faculty.map((f) => f.id) },
      });
      const facultyMap = new Map(facultyDocs.map((f) => [f.facultyId, f]));
      for (const faculty of subject.faculty) {
        const facultyDoc = facultyMap.get(faculty.id);
        if (!facultyDoc)
          return res
            .status(400)
            .json({ message: `Faculty ${faculty.id} not found` });
        if (!facultyDoc.room.equals(subjectDoc.room)) {
          return res
            .status(400)
            .json({
              message: `Faculty ${faculty.id} not assigned to room for subject ${subject.name}`,
            });
        }
      }
    }

    const fastapiResponse = await axios.post(
      `${FASTAPI_URL}/api/generate-schedule`,
      {
        subjects: subjects.map((s) => ({
          name: s.name,
          time: s.time,
          noOfClassesPerWeek: s.noOfClassesPerWeek,
          faculty: s.faculty,
        })),
        break_: break_,
        college_time: collegeTime,
        rooms: [roomId],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    const { schedule, ...timetableData } = fastapiResponse.data;
    const roomWiseSchedules = [{ room: roomId, schedule }];
    const timetable = new Timetable({
      subjects: subjectDocs.map((s) => s._id),
      breaks: break_,
      collegeTime,
      rooms: [room._id],
      schedule,
      roomWiseSchedules,
    });
    await timetable.save();
    res.status(201).json({ ...timetableData, roomWiseSchedules });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/room/:roomId", auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const timetables = await Timetable.find({ rooms: room._id }).populate(
      "subjects rooms"
    );
    const roomSchedules = timetables.map((timetable) => ({
      id: timetable._id,
      roomSchedule: timetable.roomWiseSchedules.find(
        (rs) => rs.room === roomId
      ) || { room: roomId, schedule: [] },
      subjects: timetable.subjects,
      breaks: timetable.breaks,
      collegeTime: timetable.collegeTime,
      createdAt: timetable.createdAt,
      updatedAt: timetable.updatedAt,
    }));
    res.json(roomSchedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const timetable = await Timetable.findById(id).populate("subjects rooms");
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/room/:roomId/:id", [auth, adminOnly], async (req, res) => {
  const { roomId, id } = req.params;
  const { subjects, breaks, collegeTime, schedule } = req.body;
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const timetable = await Timetable.findById(id);
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });
    if (!timetable.rooms.some((r) => r.equals(room._id)))
      return res
        .status(400)
        .json({ message: "Timetable not associated with this room" });

    const subjectDocs = await Subject.find({
      _id: { $in: subjects.map((s) => s._id) },
    }).populate("faculty room");
    const subjectMap = new Map(subjectDocs.map((s) => [s._id.toString(), s]));
    for (const subject of subjects) {
      const subjectDoc = subjectMap.get(subject._id);
      if (!subjectDoc)
        return res
          .status(400)
          .json({ message: `Subject ${subject.name} not found` });
      if (!room._id.equals(subjectDoc.room)) {
        return res
          .status(400)
          .json({
            message: `Subject ${subject.name} not assigned to room ${roomId}`,
          });
      }
    }

    const roomWiseSchedules = [{ room: roomId, schedule }];
    const updatedTimetable = await Timetable.findByIdAndUpdate(
      id,
      {
        subjects: subjectDocs.map((s) => s._id),
        breaks,
        collegeTime,
        rooms: [room._id],
        schedule,
        roomWiseSchedules,
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate("subjects rooms");
    res.json(updatedTimetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
