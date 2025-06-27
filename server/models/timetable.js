const mongoose = require("mongoose");

// Schema for individual schedule entries
const scheduleEntrySchema = new mongoose.Schema({
  subject_name: { type: String, required: true },
  
  faculty_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Faculty",
  },
  faculty_name: { type: String, required: true },
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
      "ALL_DAYS",
    ],
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room_id: { type: String, required: true },
  is_special: { type: Boolean, default: false },
  priority_score: { type: Number, default: 0 },
});

// Schema for daily schedules
const dailyScheduleSchema = new mongoose.Schema(
  {
    MONDAY: [scheduleEntrySchema],
    TUESDAY: [scheduleEntrySchema],
    WEDNESDAY: [scheduleEntrySchema],
    THURSDAY: [scheduleEntrySchema],
    FRIDAY: [scheduleEntrySchema],
    SATURDAY: [scheduleEntrySchema],
  },
  { _id: false }
);

// Main timetable schema - only weekly_schedule
const timetableSchema = new mongoose.Schema({
  time_slots: [{ type: String, required: true }],
  days: dailyScheduleSchema,
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save middleware to update the updatedAt field
timetableSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to get schedule for a specific day
timetableSchema.methods.getScheduleForDay = function (day) {
  return this.days[day.toUpperCase()] || [];
};

// Instance method to get all schedules for a specific room
timetableSchema.methods.getScheduleForRoom = function (roomId) {
  const roomSchedule = [];
  const dayNames = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  dayNames.forEach((day) => {
    const daySchedule = this.days[day] || [];
    // Fixed: Changed entry._id to entry.room_id and added null check
    const roomDaySchedule = daySchedule.filter(
      (entry) => entry && entry.room_id === roomId
    );
    roomSchedule.push(...roomDaySchedule);
  });

  return roomSchedule;
};

// Instance method to get schedule for a specific faculty
timetableSchema.methods.getScheduleForFaculty = function (facultyId) {
  const facultySchedule = [];
  const dayNames = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  dayNames.forEach((day) => {
    const daySchedule = this.days[day] || [];
    // Added null check for safety
    const facultyDaySchedule = daySchedule.filter(
      (entry) => entry && entry.faculty_id === facultyId
    );
    facultySchedule.push(...facultyDaySchedule);
  });

  return facultySchedule;
};

// Static method to create from FastAPI response
timetableSchema.statics.createFromFastAPIResponse = function (apiResponse) {
  return new this(apiResponse.weekly_schedule);
};

module.exports = mongoose.model("Timetable", timetableSchema);
