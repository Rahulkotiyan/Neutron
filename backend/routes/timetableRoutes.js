const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetableController");
const verifyToken = require("../middleware/authMiddleware");

// College Timetable Routes
router.get("/college", timetableController.getCollegeTimetable);
router.get("/college/all", timetableController.getAllCollegeTimetables);
router.post(
  "/college",
  verifyToken,
  timetableController.createCollegeTimetable
);
router.put(
  "/college/:id",
  verifyToken,
  timetableController.updateCollegeTimetable
);

// Personal Timetable Routes
router.get("/personal", verifyToken, timetableController.getPersonalTimetable);
router.put(
  "/personal",
  verifyToken,
  timetableController.updatePersonalTimetable
);

// Attendance Routes
router.get("/attendance", verifyToken, timetableController.getAttendance);
router.post(
  "/attendance/subject",
  verifyToken,
  timetableController.addSubjectAttendance
);
router.post(
  "/attendance/mark",
  verifyToken,
  timetableController.markAttendance
);
router.get(
  "/attendance/stats",
  verifyToken,
  timetableController.getAttendanceStats
);
router.delete(
  "/attendance/subject/:subjectCode",
  verifyToken,
  timetableController.deleteSubjectAttendance
);

module.exports = router;
