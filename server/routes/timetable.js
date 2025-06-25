const express = require("express");
const router = express.Router();
const { Timetable, Room, Subject, Faculty } = require("../models");
const { auth, adminOnly } = require("../middleware/auth");
const axios = require("axios");

const FASTAPI_URL = "http://127.0.0.1:8000";

router.post("/room/:roomId/generate", [auth, adminOnly], async (req, res) => {
  const { roomId } = req.params;
  let { subjects, break_, college_time } = req.body;

  // Debug log

  try {
    // Parse stringified faculty arrays if needed
    subjects = subjects.map((subject) => {
      if (typeof subject.faculty === "string") {
        try {
          subject.faculty = JSON.parse(subject.faculty);
        } catch (err) {
          throw new Error(
            `Invalid JSON in faculty for subject: ${subject.name}`
          );
        }
      }
      return subject;
    });

    // Validate room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Validate subjects
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        message: "Subjects array is required and must not be empty",
      });
    }

    for (const subject of subjects) {
      if (!subject.name || !subject.time || !subject.no_of_classes_per_week) {
        return res.status(400).json({
          message: `Invalid subject data: ${
            subject.name || "Unknown"
          } - missing required fields (name, time, no_of_classes_per_week)`,
        });
      }

      if (
        typeof subject.no_of_classes_per_week !== "number" ||
        subject.no_of_classes_per_week <= 0
      ) {
        return res.status(400).json({
          message: `Subject ${subject.name} must have a valid number of classes per week (positive integer)`,
        });
      }

      if (
        !subject.faculty ||
        !Array.isArray(subject.faculty) ||
        subject.faculty.length === 0
      ) {
        return res.status(400).json({
          message: `Subject ${subject.name} must have at least one faculty member`,
        });
      }

      for (const faculty of subject.faculty) {
        if (!faculty.id || !faculty.name) {
          return res.status(400).json({
            message: `Invalid faculty data in subject ${subject.name} - missing id or name`,
          });
        }

        if (faculty.availability && Array.isArray(faculty.availability)) {
          for (const avail of faculty.availability) {
            if (!avail.day || !avail.startTime || !avail.endTime) {
              return res.status(400).json({
                message: `Invalid availability data for faculty ${faculty.name} in subject ${subject.name}`,
              });
            }

            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (
              !timeRegex.test(avail.startTime) ||
              !timeRegex.test(avail.endTime)
            ) {
              return res.status(400).json({
                message: `Invalid time format for faculty ${faculty.name} availability. Use HH:MM format`,
              });
            }
          }
        }
      }
    }

    // Validate college time
    if (!college_time || !college_time.startTime || !college_time.endTime) {
      return res.status(400).json({
        message: "College time must include startTime and endTime",
      });
    }

    // Validate breaks
    if (break_ && Array.isArray(break_)) {
      for (const breakTime of break_) {
        if (!breakTime.startTime || !breakTime.endTime) {
          return res.status(400).json({
            message: "Break times must include startTime and endTime",
          });
        }
      }
    }

    // Prepare payload for FastAPI

    const fastapiPayload = {
      subjects: subjects.map((s) => ({
        name: s.name,
        time: s.time,
        no_of_classes_per_week: s.no_of_classes_per_week,
        faculty: s.faculty.map((f) => ({
          id: f.id || f._id, // support both id formats
          name: f.name,
          availability: f.availability || [],
        })),
      })),
      break_,
      college_time,
      rooms: [roomId],
    };

    const fastapiResponse = await axios.post(
      `${FASTAPI_URL}/api/generate-schedule`,
      JSON.stringify(fastapiPayload),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const fastapiData = fastapiResponse.data;

    if (!fastapiData) {
      throw new Error("Empty response from FastAPI service");
    }
    console.log("FastAPI response:", fastapiData);
    // Handle FastAPI response format
    let roomWiseSchedules = [];

    if (fastapiData.schedule) {
      roomWiseSchedules.push({ room: roomId, schedule: fastapiData.schedule });
    } else if (fastapiData.roomWiseSchedules) {
      roomWiseSchedules = fastapiData.roomWiseSchedules.map((item) => ({
        room: item.roomId || item.room || roomId,
        schedule: item.schedule,
      }));
    } else if (fastapiData.weekly_schedule) {
      roomWiseSchedules.push({
        room: roomId,
        schedule: fastapiData.weekly_schedule,
      });
    } else {
      throw new Error("Invalid response format from FastAPI");
    }

    // Validation helper
    
    const timetable = new Timetable({
      subjects: subjects.map((s) => s.name),
      breaks: break_,
      college_time,
      rooms: [room._id],
      roomWiseSchedules,
      schedule: fastapiData.weekly_schedule || fastapiData.schedule || null,
      
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedTimetable = await timetable.save();
    
    const responseData = {
      success: true,
      message: "Schedule generated and saved successfully",
      scheduler: savedTimetable,
    };
    if (fastapiData.metadata) {
      responseData.fastapiMetadata = fastapiData.metadata;
    }

    if (fastapiData.fitness !== undefined) {
      responseData.scheduleQuality = {
        fitness: fastapiData.fitness,
        utilizationPercentage: fastapiData.utilization_percentage,
        totalAssignments: fastapiData.total_assignments,
        unassigned: fastapiData.unassigned || [],
        subjectCoverage: fastapiData.subject_coverage,
      };
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error in schedule generation:", error);

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Schedule generation service is unavailable",
        error: "Unable to connect to FastAPI service",
        details: `Failed to connect to ${FASTAPI_URL}`,
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json({
        message: "Schedule generation failed",
        error:
          error.response.data?.message || error.response.data || error.message,
        fastapiError: true,
      });
    }

    if (error.code === "ECONNABORTED") {
      return res.status(408).json({
        message: "Schedule generation timed out",
        error: "Request took too long to complete (>60 seconds)",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Database validation error",
        error: error.message,
        details: error.errors,
      });
    }

    res.status(500).json({
      message: "Internal server error during schedule generation",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Optional: Add a route to get schedule validation details
router.get("/timetable/:timetableId/validation", [auth], async (req, res) => {
  try {
    const { timetableId } = req.params;

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    res.json({
      timetableId: timetable._id,
      validationResults: timetable.validationResults,
      metadata: {
        createdAt: timetable.createdAt,
        subjects: timetable.subjects,
        rooms: timetable.rooms,
      },
    });
  } catch (error) {
    console.error("Error fetching validation details:", error);
    res.status(500).json({
      message: "Error fetching validation details",
      error: error.message,
    });
  }
});

router.get("/room/:roomId", auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findById({ roomId });
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
      college_time: timetable.college_time,
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
  const { subjects, breaks, college_time, schedule } = req.body;
  try {
    const room = await Room.findById({ roomId });
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
        return res.status(400).json({
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
        college_time,
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
