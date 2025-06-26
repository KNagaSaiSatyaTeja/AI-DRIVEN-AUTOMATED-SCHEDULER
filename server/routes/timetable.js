const express = require("express");
const router = express.Router();
const { Timetable, Room, Subject, Faculty } = require("../models");
const { auth, adminOnly } = require("../middleware/auth");
const axios = require("axios");

const FASTAPI_URL = "http://127.0.0.1:8000";

router.post("/room/:roomId/generate", [auth, adminOnly], async (req, res) => {
  const { roomId } = req.params;
  let { subjects, break_, college_time } = req.body;

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
          id: f.id || f._id,
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

    // Extract weekly schedule data from FastAPI response
    let weeklyScheduleData = null;
    let timeSlots = [];

    if (fastapiData.weekly_schedule) {
      weeklyScheduleData = fastapiData.weekly_schedule;
      timeSlots = fastapiData.weekly_schedule.time_slots || [];
    } else if (fastapiData.schedule) {
      // Handle legacy format if needed
      weeklyScheduleData = {
        time_slots: fastapiData.time_slots || [],
        days: fastapiData.schedule,
      };
      timeSlots = fastapiData.time_slots || [];
    } else {
      throw new Error(
        "Invalid response format from FastAPI - missing schedule data"
      );
    }

    // Check if timetable already exists for this room
    let existingTimetable = await Timetable.findOne({});

    // For room-specific filtering, we'll use the schema methods
    let savedTimetable;
    let isUpdate = false;

    if (existingTimetable) {
      // Update existing timetable
      isUpdate = true;
      existingTimetable.time_slots = timeSlots;
      existingTimetable.days = weeklyScheduleData.days;
      existingTimetable.updatedAt = new Date();
      savedTimetable = await existingTimetable.save();
    } else {
      // Create new timetable using the schema static method
      savedTimetable = Timetable.createFromFastAPIResponse(fastapiData);
      await savedTimetable.save();
    }

    // Get room-specific schedule using schema method
    const roomSchedule = savedTimetable.getScheduleForRoom(roomId);

    const responseData = {
      success: true,
      message: isUpdate
        ? "Schedule updated successfully"
        : "Schedule generated and saved successfully",
      timetable: savedTimetable,
      roomSchedule: roomSchedule,
      isUpdate: isUpdate,
      fastapiResponse: fastapiData,
      scheduleQuality: {
        fitness: fastapiData.fitness,
        utilizationPercentage: fastapiData.utilization_percentage,
        totalAssignments: fastapiData.total_assignments,
        unassigned: fastapiData.unassigned || [],
        subjectCoverage: fastapiData.subject_coverage,
      },
    };

    res.status(isUpdate ? 200 : 201).json(responseData);
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

// Get timetable for a specific room
router.get("/room/:roomId", auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const timetable = await Timetable.findOne({});
    if (!timetable) {
      return res.status(404).json({ message: "No timetable found" });
    }

    // Use schema method to get room-specific schedule
    const roomSchedule = timetable.getScheduleForRoom(roomId);

    res.json({
      id: timetable._id,
      roomId: roomId,
      schedule: roomSchedule,
      timeSlots: timetable.time_slots,
      createdAt: timetable.createdAt,
      updatedAt: timetable.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get timetable for a specific day
router.get("/day/:day", auth, async (req, res) => {
  const { day } = req.params;
  try {
    const timetable = await Timetable.findOne({});
    if (!timetable) {
      return res.status(404).json({ message: "No timetable found" });
    }

    // Use schema method to get day-specific schedule
    const daySchedule = timetable.getScheduleForDay(day);

    res.json({
      id: timetable._id,
      day: day.toUpperCase(),
      schedule: daySchedule,
      timeSlots: timetable.time_slots,
      createdAt: timetable.createdAt,
      updatedAt: timetable.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get timetable for a specific faculty
router.get("/faculty/:facultyId", auth, async (req, res) => {
  const { facultyId } = req.params;
  try {
    const timetable = await Timetable.findOne({});
    if (!timetable) {
      return res.status(404).json({ message: "No timetable found" });
    }

    // Use schema method to get faculty-specific schedule
    const facultySchedule = timetable.getScheduleForFaculty(facultyId);

    res.json({
      id: timetable._id,
      facultyId: facultyId,
      schedule: facultySchedule,
      timeSlots: timetable.time_slots,
      createdAt: timetable.createdAt,
      updatedAt: timetable.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific timetable by ID
router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const timetable = await Timetable.findById(id);
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });

    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update timetable for a specific room
router.put("/room/:roomId/:id", [auth, adminOnly], async (req, res) => {
  const { roomId, id } = req.params;
  const { schedule, timeSlots } = req.body;

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const timetable = await Timetable.findById(id);
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });

    // Validate that the room exists in the schedule
    const roomSchedule = timetable.getScheduleForRoom(roomId);
    if (roomSchedule.length === 0) {
      return res.status(400).json({
        message: "No schedule found for this room in the timetable",
      });
    }

    // Update time slots if provided
    if (timeSlots) {
      timetable.time_slots = timeSlots;
    }

    // Update schedule if provided
    if (schedule) {
      // Validate schedule entries
      const dayNames = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ];

      for (const day of dayNames) {
        if (schedule[day]) {
          // Filter out entries for this room and add new ones
          timetable.days[day] = timetable.days[day].filter(
            (entry) => entry.room_id !== roomId
          );

          // Add new schedule entries for this room
          const newEntries = schedule[day].filter(
            (entry) => entry.room_id === roomId
          );
          timetable.days[day].push(...newEntries);
        }
      }
    }

    timetable.updatedAt = new Date();
    const updatedTimetable = await timetable.save();

    res.json({
      timetable: updatedTimetable,
      roomSchedule: updatedTimetable.getScheduleForRoom(roomId),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all timetables
router.get("/", auth, async (req, res) => {
  try {
    const timetables = await Timetable.find();
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete timetable
router.delete("/:id", [auth, adminOnly], async (req, res) => {
  const { id } = req.params;
  try {
    const timetable = await Timetable.findByIdAndDelete(id);
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });

    res.json({ message: "Timetable deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get complete weekly schedule
router.get("/weekly/schedule", auth, async (req, res) => {
  try {
    const timetable = await Timetable.findOne({});
    if (!timetable) {
      return res.status(404).json({ message: "No timetable found" });
    }

    res.json({
      id: timetable._id,
      timeSlots: timetable.time_slots,
      days: timetable.days,
      createdAt: timetable.createdAt,
      updatedAt: timetable.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get schedule statistics
router.get("/stats/overview", auth, async (req, res) => {
  try {
    const timetable = await Timetable.findOne({});
    if (!timetable) {
      return res.status(404).json({ message: "No timetable found" });
    }

    const stats = {
      totalTimeSlots: timetable.time_slots.length,
      totalScheduleEntries: 0,
      roomsInUse: new Set(),
      facultyInUse: new Set(),
      subjectsScheduled: new Set(),
      dayWiseStats: {},
    };

    const dayNames = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];

    dayNames.forEach((day) => {
      const daySchedule = timetable.days[day] || [];
      stats.totalScheduleEntries += daySchedule.length;
      stats.dayWiseStats[day] = daySchedule.length;

      daySchedule.forEach((entry) => {
        stats.roomsInUse.add(entry.room_id);
        stats.facultyInUse.add(entry.faculty_id);
        stats.subjectsScheduled.add(entry.subject_name);
      });
    });

    // Convert Sets to arrays for JSON response
    stats.roomsInUse = Array.from(stats.roomsInUse);
    stats.facultyInUse = Array.from(stats.facultyInUse);
    stats.subjectsScheduled = Array.from(stats.subjectsScheduled);

    res.json({
      timetableId: timetable._id,
      statistics: stats,
      createdAt: timetable.createdAt,
      updatedAt: timetable.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
