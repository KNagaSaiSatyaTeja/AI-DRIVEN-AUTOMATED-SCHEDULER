const express = require("express");
const authRoutes = require("./auth");
const timetableRoutes = require("./timetable");
const roomRoutes = require("./room");
const facultyRoutes = require("./faculty");
const subjectRoutes = require("./subject");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/timetable", timetableRoutes);
router.use("/rooms", roomRoutes);
router.use("/faculty", facultyRoutes);
router.use("/subjects", subjectRoutes);

module.exports = router;
