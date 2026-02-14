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
  timetableController.createCollegeTimetable,
);
router.put(
  "/college/:id",
  verifyToken,
  timetableController.updateCollegeTimetable,
);

// Personal Timetable Routes
router.get("/personal", verifyToken, timetableController.getPersonalTimetable);
router.put(
  "/personal",
  verifyToken,
  timetableController.updatePersonalTimetable,
);

// Personal Class Routes (Enhanced)
router.get(
  "/personal/today",
  verifyToken,
  timetableController.getTodaySchedule,
);
router.get(
  "/personal/current-class",
  verifyToken,
  timetableController.getCurrentClass,
);
router.post(
  "/personal/class",
  verifyToken,
  timetableController.addPersonalClass,
);
router.put(
  "/personal/class/:day/:classId",
  verifyToken,
  timetableController.editPersonalClass,
);
router.delete(
  "/personal/class/:day/:classId",
  verifyToken,
  timetableController.deletePersonalClass,
);

// Free Period Routes
router.get(
  "/personal/free-periods",
  verifyToken,
  timetableController.getFreePeriods,
);

// Attendance Routes
router.get("/attendance", verifyToken, timetableController.getAttendance);
router.post(
  "/attendance/subject",
  verifyToken,
  timetableController.addSubjectAttendance,
);
router.post(
  "/attendance/mark",
  verifyToken,
  timetableController.markAttendance,
);
router.get(
  "/attendance/stats",
  verifyToken,
  timetableController.getAttendanceStats,
);
router.delete(
  "/attendance/subject/:subjectCode",
  verifyToken,
  timetableController.deleteSubjectAttendance,
);

// Enhanced Attendance Routes
router.get(
  "/attendance/bunk-capacity",
  verifyToken,
  timetableController.calculateBunkCapacity,
);
router.get(
  "/attendance/calendar/:subjectCode",
  verifyToken,
  timetableController.getAttendanceCalendar,
);

// Exam Schedule Routes
router.post(
  "/exam-schedule",
  verifyToken,
  timetableController.createExamSchedule,
);
router.get("/exam-schedule", timetableController.getExamSchedule);

// Faculty Routes
router.get("/faculty", timetableController.getFacultyInfo);

module.exports = router;
