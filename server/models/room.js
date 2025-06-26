const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  // roomId: {
  //   type: String,
  //   required: true,
  //   unique: true,
  //   default: () => `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  // },
  name: { type: String, required: true, unique: true }, // Use name as the unique identifier for display
  capacity: { type: Number, default: 60, min: 1 }, // Minimum capacity of 1
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faculty" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
