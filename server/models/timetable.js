const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ],
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const breakSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
      "ALL_DAYS",
    ],
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const collegeTimeSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const roomScheduleSchema = new mongoose.Schema({
  room: { type: String, required: true },
  schedule: [
    {
      subjectName: String,
      facultyId: String,
      facultyName: String,
      day: String,
      startTime: String,
      endTime: String,
      roomId: String,
      isSpecial: Boolean,
      priorityScore: Number,
    },
  ],
});

const timetableSchema = new mongoose.Schema({
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  breaks: [breakSchema],
  collegeTime: collegeTimeSchema,
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
  schedule: [
    {
      subjectName: String,
      facultyId: String,
      facultyName: String,
      day: String,
      startTime: String,
      endTime: String,
      roomId: String,
      isSpecial: Boolean,
      priorityScore: Number,
    },
  ],
  roomWiseSchedules: [roomScheduleSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Timetable", timetableSchema);
