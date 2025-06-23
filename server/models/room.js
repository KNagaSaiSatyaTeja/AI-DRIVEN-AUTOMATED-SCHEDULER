const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Use name as the unique identifier for display
  capacity: { type: Number, default: null },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faculty" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);