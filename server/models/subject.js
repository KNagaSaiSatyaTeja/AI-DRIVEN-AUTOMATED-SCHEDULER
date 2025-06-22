const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  time: { type: Number, required: true },
  noOfClassesPerWeek: { type: Number, required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faculty" }],
  isSpecial: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subject", subjectSchema);
