const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  capacity: { type: Number, default: null },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faculty" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);