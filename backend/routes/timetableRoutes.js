const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetableController");
const verifyToken = require("../middleware/authMiddleware");
const { cacheMiddleware, clearOnSuccess } = require("../middleware/simpleCache");

// Personal Timetable Routes
router.get("/personal", verifyToken, cacheMiddleware(60000), timetableController.getPersonalTimetable);

// Personal Class Routes (Enhanced)
router.get(
  "/personal/today",
  verifyToken,
  cacheMiddleware(30000),
  timetableController.getTodaySchedule,
);
router.get(
  "/personal/current-class",
  verifyToken,
  cacheMiddleware(15000),
  timetableController.getCurrentClass,
);
router.post(
  "/personal/class",
  verifyToken,
  clearOnSuccess(req => `/api/timetable|${req.user._id}`),
  timetableController.addPersonalClass,
);
router.put(
  "/personal/class/:day/:classId",
  verifyToken,
  clearOnSuccess(req => `/api/timetable|${req.user._id}`),
  timetableController.editPersonalClass,
);
router.delete(
  "/personal/class/:day/:classId",
  verifyToken,
  clearOnSuccess(req => `/api/timetable|${req.user._id}`),
  timetableController.deletePersonalClass,
);

// Free Period Routes
router.get(
  "/personal/free-periods",
  verifyToken,
  cacheMiddleware(60000),
  timetableController.getFreePeriods,
);

// Attendance Routes
router.get("/attendance", verifyToken, cacheMiddleware(30000), timetableController.getAttendance);
router.post(
  "/attendance/subject",
  verifyToken,
  clearOnSuccess(req => `/api/timetable|${req.user._id}`),
  timetableController.addSubjectAttendance,
);
router.post(
  "/attendance/mark",
  verifyToken,
  clearOnSuccess(req => `/api/timetable|${req.user._id}`),
  timetableController.markAttendance,
);
router.delete(
  "/attendance/subject/:subjectCode",
  verifyToken,
  clearOnSuccess(req => `/api/timetable|${req.user._id}`),
  timetableController.deleteSubjectAttendance,
);

// Enhanced Attendance Routes
router.get(
  "/attendance/bunk-capacity",
  verifyToken,
  cacheMiddleware(30000),
  timetableController.calculateBunkCapacity,
);
router.get(
  "/attendance/calendar/:subjectCode",
  verifyToken,
  cacheMiddleware(60000),
  timetableController.getAttendanceCalendar,
);

// Student Exams Routes
router.get(
  "/student-exams",
  verifyToken,
  cacheMiddleware(60000),
  timetableController.getStudentExams,
);
router.post(
  "/student-exam",
  verifyToken,
  clearOnSuccess(req => `/api/timetable|${req.user._id}`),
  timetableController.createStudentExam,
);
router.put(
  "/student-exam/:id",
  verifyToken,
  clearOnSuccess(req => `/api/timetable|${req.user._id}`),
  timetableController.updateStudentExam,
);
router.delete(
  "/student-exam/:id",
  verifyToken,
  clearOnSuccess(req => `/api/timetable|${req.user._id}`),
  timetableController.deleteStudentExam,
);

module.exports = router;
