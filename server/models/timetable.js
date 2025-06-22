const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const facultySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  availability: [timeSlotSchema],
});

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  time: { type: Number, required: true },
  noOfClassesPerWeek: { type: Number, required: true },
  faculty: [facultySchema],
  preferredSlots: [timeSlotSchema],
  isSpecial: { type: Boolean, default: false },
});

const breakSchema = new mongoose.Schema({
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const collegeTimeSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const timetableSchema = new mongoose.Schema({
  subjects: [subjectSchema],
  breaks: [breakSchema],
  collegeTime: collegeTimeSchema,
  rooms: [{ type: String, required: true }],
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Timetable", timetableSchema);
