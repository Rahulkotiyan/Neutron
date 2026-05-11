const {
  CollegeTimetable,
  PersonalTimetable,
  Attendance,
  User,
  ExamSchedule,
  Faculty,
  StudentExam,
} = require("../models/Schema");

// Helper function to calculate minutes between two time strings
const calculateMinutesBetween = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
};

// COLLEGE TIMETABLE ENDPOINTS
exports.getCollegeTimetable = async (req, res) => {
  try {
    const { college, branch, semester } = req.query;

    if (!college || !branch || !semester) {
      return res.status(400).json({
        success: false,
        message: "College, branch, and semester are required",
      });
    }

    const timetable = await CollegeTimetable.findOne({
      college,
      branch,
      semester,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    res.status(200).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    console.error("Error fetching college timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching timetable",
      error: error.message,
    });
  }
};

exports.getAllCollegeTimetables = async (req, res) => {
  try {
    const timetables = await CollegeTimetable.find({});

    res.status(200).json({
      success: true,
      data: timetables,
    });
  } catch (error) {
    console.error("Error fetching all timetables:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching timetables",
      error: error.message,
    });
  }
};

exports.createCollegeTimetable = async (req, res) => {
  try {
    const { college, branch, semester, schedule } = req.body;

    if (!college || !branch || !semester || !schedule) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if timetable already exists
    const existing = await CollegeTimetable.findOne({
      college,
      branch,
      semester,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Timetable already exists for this combination",
      });
    }

    const newTimetable = new CollegeTimetable({
      college,
      branch,
      semester,
      schedule,
    });

    await newTimetable.save();

    res.status(201).json({
      success: true,
      message: "Timetable created successfully",
      data: newTimetable,
    });
  } catch (error) {
    console.error("Error creating college timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error creating timetable",
      error: error.message,
    });
  }
};

exports.updateCollegeTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { schedule } = req.body;

    const updated = await CollegeTimetable.findByIdAndUpdate(
      id,
      { schedule, updatedAt: Date.now() },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Timetable updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating college timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error updating timetable",
      error: error.message,
    });
  }
};

// PERSONAL TIMETABLE ENDPOINTS
exports.getPersonalTimetable = async (req, res) => {
  try {
    const userId = req.user._id;

    const timetable = await PersonalTimetable.findOne({ user: userId });

    if (!timetable) {
      // Create empty personal timetable if doesn't exist
      const user = await User.findById(userId);
      const newTimetable = new PersonalTimetable({
        user: userId,
        college: user?.college || "AIT Bangalore",
        schedule: [],
      });
      await newTimetable.save();
      return res.status(200).json({
        success: true,
        data: newTimetable,
      });
    }

    res.status(200).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    console.error("Error fetching personal timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching personal timetable",
      error: error.message,
    });
  }
};

exports.updatePersonalTimetable = async (req, res) => {
  try {
    const userId = req.user._id;
    const { schedule } = req.body;

    let timetable = await PersonalTimetable.findOne({ user: userId });

    if (!timetable) {
      const user = await User.findById(userId);
      timetable = new PersonalTimetable({
        user: userId,
        college: user?.college || "AIT Bangalore",
        schedule,
      });
    } else {
      timetable.schedule = schedule;
      timetable.updatedAt = Date.now();
    }

    await timetable.save();

    res.status(200).json({
      success: true,
      message: "Personal timetable updated successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error updating personal timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error updating personal timetable",
      error: error.message,
    });
  }
};

// ATTENDANCE ENDPOINTS
exports.getAttendance = async (req, res) => {
  try {
    const userId = req.user._id;

    let attendance = await Attendance.findOne({ user: userId.toString() });

    if (!attendance) {
      const user = await User.findById(userId);
      attendance = new Attendance({
        user: userId,
        college: user?.college || "AIT Bangalore",
        subjects: [],
      });
      await attendance.save();
    }

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance",
      error: error.message,
    });
  }
};

exports.addSubjectAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subjectCode, subjectName } = req.body;

    console.log("Add subject request - User ID:", userId);
    console.log("Add subject request - Subject Code:", subjectCode);
    console.log("Add subject request - Subject Name:", subjectName);

    if (!subjectCode || !subjectName) {
      return res.status(400).json({
        success: false,
        message: "Subject code and name are required",
      });
    }

    let attendance = await Attendance.findOne({ user: userId.toString() });

    console.log("Attendance found:", !!attendance);
    if (attendance) {
      console.log("Current subjects count:", attendance.subjects.length);
      console.log("Current subjects:", attendance.subjects.map(s => ({ code: s.subjectCode, name: s.subjectName })));
    }

    if (!attendance) {
      const user = await User.findById(userId);
      attendance = new Attendance({
        user: userId,
        college: user?.college || "AIT Bangalore",
        subjects: [],
      });
    }

    // Check if subject already exists
    const existingSubject = attendance.subjects.find(
      (s) => s.subjectCode === subjectCode,
    );

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject already added",
      });
    }

    console.log("Adding new subject to array...");
    attendance.subjects.push({
      subjectCode,
      subjectName,
      totalClasses: 0,
      classesAttended: 0,
      classesSkipped: 0,
      attendanceRecords: [],
    });

    console.log("Subjects count after push:", attendance.subjects.length);
    console.log("About to save attendance record...");
    await attendance.save();
    console.log("Attendance saved successfully!");
    console.log("Final subjects count:", attendance.subjects.length);

    res.status(200).json({
      success: true,
      message: "Subject added successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Error adding subject:", error);
    res.status(500).json({
      success: false,
      message: "Error adding subject",
      error: error.message,
    });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subjectCode, date, timeSlot, status, notes } = req.body;

    if (!subjectCode || !date || !timeSlot || !status) {
      return res.status(400).json({
        success: false,
        message: "Subject code, date, time slot, and status are required",
      });
    }

    if (!["PRESENT", "ABSENT", "LEAVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be PRESENT, ABSENT, or LEAVE",
      });
    }

    let attendance = await Attendance.findOne({ user: userId.toString() });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found. Add a subject first.",
      });
    }

    const subject = attendance.subjects.find(
      (s) => s.subjectCode === subjectCode,
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Add attendance record
    subject.attendanceRecords.push({
      date: new Date(date),
      timeSlot,
      status,
      notes,
    });

    // Update totals
    subject.totalClasses += 1;
    if (status === "PRESENT") {
      subject.classesAttended += 1;
    } else if (status === "ABSENT") {
      subject.classesSkipped += 1;
    }

    attendance.updatedAt = Date.now();
    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: "Error marking attendance",
      error: error.message,
    });
  }
};

exports.getAttendanceStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const attendance = await Attendance.findOne({ user: userId.toString() });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Calculate overall stats
    const totalClasses = attendance.subjects.reduce(
      (sum, s) => sum + s.totalClasses,
      0,
    );
    const totalAttended = attendance.subjects.reduce(
      (sum, s) => sum + s.classesAttended,
      0,
    );
    const totalSkipped = attendance.subjects.reduce(
      (sum, s) => sum + s.classesSkipped,
      0,
    );
    const overallPercentage =
      totalClasses > 0
        ? parseFloat(((totalAttended / totalClasses) * 100).toFixed(2))
        : 0;

    // Calculate bunking projections
    const projections = attendance.subjects.map((subject) => {
      const currentPercentage = subject.attendancePercentage;
      const requiredPercentage = 75; // Assuming 75% is required

      if (currentPercentage >= requiredPercentage) {
        // Calculate how many classes can be bunked
        const classesCanBeBunked = Math.floor(
          subject.totalClasses -
            (requiredPercentage / 100) * subject.totalClasses -
            1,
        );
        return {
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          currentPercentage,
          classesCanBeBunked: Math.max(0, classesCanBeBunked),
          status: "SAFE",
        };
      } else {
        // Need to attend more classes
        const classesNeeded = Math.ceil(
          (requiredPercentage / 100) * (subject.totalClasses + 5) -
            subject.classesAttended,
        );
        return {
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          currentPercentage,
          classesNeeded: Math.max(0, classesNeeded),
          status: "AT_RISK",
        };
      }
    });

    res.status(200).json({
      success: true,
      data: {
        overallStats: {
          totalClasses,
          totalAttended,
          totalSkipped,
          overallPercentage,
        },
        subjectStats: attendance.subjects.map((s) => ({
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          totalClasses: s.totalClasses,
          classesAttended: s.classesAttended,
          classesSkipped: s.classesSkipped,
          attendancePercentage: s.attendancePercentage,
        })),
        bunkingProjections: projections,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance stats",
      error: error.message,
    });
  }
};

exports.deleteSubjectAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subjectCode } = req.params;

    console.log("Delete subject request - User ID:", userId);
    console.log("Delete subject request - Subject Code:", subjectCode);

    const attendance = await Attendance.findOne({ user: userId.toString() });

    if (!attendance) {
      console.log("Attendance record not found for user:", userId);
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    console.log("Attendance found - Subjects before deletion:", attendance.subjects.length);
    console.log("Subjects before deletion:", attendance.subjects.map(s => ({ code: s.subjectCode, name: s.subjectName })));

    const originalLength = attendance.subjects.length;
    attendance.subjects = attendance.subjects.filter(
      (s) => s.subjectCode !== subjectCode,
    );
    
    console.log("Subjects after deletion:", attendance.subjects.length);
    console.log("Subject was deleted:", originalLength > attendance.subjects.length);

    attendance.updatedAt = Date.now();
    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Subject attendance deleted successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting subject",
      error: error.message,
    });
  }
};

// ==================== ENHANCED TIMETABLE ENDPOINTS ====================

// Get today's schedule
exports.getTodaySchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

    const timetable = await PersonalTimetable.findOne({ user: userId });

    if (!timetable) {
      return res.status(200).json({
        success: true,
        data: { day: today, classes: [] },
      });
    }

    const todaySchedule = timetable.schedule.find((s) => s.day === today);

    res.status(200).json({
      success: true,
      data: {
        day: today,
        classes: todaySchedule?.classes || [],
      },
    });
  } catch (error) {
    console.error("Error fetching today's schedule:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching today's schedule",
      error: error.message,
    });
  }
};

// Get current and next class
exports.getCurrentClass = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    const today = now.toLocaleDateString("en-US", { weekday: "long" });

    const timetable = await PersonalTimetable.findOne({ user: userId });

    if (!timetable) {
      return res.status(200).json({
        success: true,
        data: { current: null, next: null },
      });
    }

    const todaySchedule = timetable.schedule.find((s) => s.day === today);

    if (!todaySchedule || todaySchedule.classes.length === 0) {
      return res.status(200).json({
        success: true,
        data: { current: null, next: null },
      });
    }

    let currentClass = null;
    let nextClass = null;

    for (const cls of todaySchedule.classes) {
      const [startTime, endTime] = cls.timeSlot.split("-").map((t) => t.trim());
      const start = startTime.split(":").join("");
      const end = endTime.split(":").join("");
      const current = currentTime.split(":").join("");

      if (current >= start && current <= end) {
        currentClass = cls;
      } else if (current < start && !nextClass) {
        nextClass = cls;
      }
    }

    res.status(200).json({
      success: true,
      data: { current: currentClass, next: nextClass },
    });
  } catch (error) {
    console.error("Error fetching current class:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching current class",
      error: error.message,
    });
  }
};

// Add a personal class with color coding
exports.addPersonalClass = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      day,
      startTime,
      endTime,
      subject,
      subjectCode,
      professor,
      professorEmail,
      room,
      building,
      type,
      color,
      customNote,
      notificationsEnabled,
      notificationTimes,
    } = req.body;

    if (!day || !startTime || !endTime || !subject) {
      return res.status(400).json({
        success: false,
        message: "Day, start time, end time, and subject are required",
      });
    }

    let timetable = await PersonalTimetable.findOne({ user: userId });

    if (!timetable) {
      const user = await User.findById(userId);
      timetable = new PersonalTimetable({
        user: userId,
        college: user?.college || "AIT Bangalore",
        schedule: [],
      });
    }

    const daySchedule = timetable.schedule.find((s) => s.day === day);

    const mongoose = require("mongoose");
    const newClass = {
      _id: new mongoose.Types.ObjectId(),
      timeSlot: `${startTime} - ${endTime}`,
      startTime,
      endTime,
      subject,
      subjectCode,
      professor,
      professorEmail,
      room,
      building,
      type: type || "LECTURE",
      customNote,
      color: color || "#3498db",
      isEdited: true,
      editedAt: new Date(),
      isOptional: false,
      notificationsEnabled: notificationsEnabled !== false,
      notificationTimes: notificationTimes || [10, 30],
    };

    if (daySchedule) {
      daySchedule.classes.push(newClass);
    } else {
      timetable.schedule.push({
        day,
        classes: [newClass],
      });
    }

    await timetable.save();

    res.status(201).json({
      success: true,
      message: "Class added successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error adding personal class:", error);
    res.status(500).json({
      success: false,
      message: "Error adding personal class",
      error: error.message,
    });
  }
};

// Edit a personal class
exports.editPersonalClass = async (req, res) => {
  try {
    const userId = req.user._id;
    const { day, classId } = req.params;
    const updates = req.body;

    const timetable = await PersonalTimetable.findOne({ user: userId });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    const daySchedule = timetable.schedule.find((s) => s.day === day);

    if (!daySchedule) {
      return res.status(404).json({
        success: false,
        message: "Day schedule not found",
      });
    }

    const classIndex = daySchedule.classes.findIndex(
      (c) => c._id.toString() === classId,
    );

    if (classIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Update the class
    daySchedule.classes[classIndex] = {
      ...daySchedule.classes[classIndex].toObject(),
      ...updates,
      isEdited: true,
      editedAt: new Date(),
    };

    timetable.updatedAt = Date.now();
    await timetable.save();

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error editing personal class:", error);
    res.status(500).json({
      success: false,
      message: "Error editing personal class",
      error: error.message,
    });
  }
};

// Delete a personal class
exports.deletePersonalClass = async (req, res) => {
  try {
    const userId = req.user._id;
    const { day, classId } = req.params;

    const timetable = await PersonalTimetable.findOne({ user: userId });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    const daySchedule = timetable.schedule.find((s) => s.day === day);

    if (!daySchedule) {
      return res.status(404).json({
        success: false,
        message: "Day schedule not found",
      });
    }

    daySchedule.classes = daySchedule.classes.filter(
      (c) => c._id.toString() !== classId,
    );

    timetable.updatedAt = Date.now();
    await timetable.save();

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error deleting personal class:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting personal class",
      error: error.message,
    });
  }
};

// Detect free periods
exports.getFreePeriods = async (req, res) => {
  try {
    const userId = req.user._id;
    const { day } = req.query;

    const timetable = await PersonalTimetable.findOne({ user: userId });

    if (!timetable) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const targetDay =
      day || new Date().toLocaleDateString("en-US", { weekday: "long" });
    const daySchedule = timetable.schedule.find((s) => s.day === targetDay);

    if (!daySchedule || daySchedule.classes.length === 0) {
      return res.status(200).json({
        success: true,
        data: [{ start: "09:00", end: "17:00", duration: 480 }], // Full day free
      });
    }

    // Sort classes by start time
    const sortedClasses = [...daySchedule.classes].sort((a, b) => {
      const aStart = a.startTime.replace(":", "");
      const bStart = b.startTime.replace(":", "");
      return aStart - bStart;
    });

    const freePeriods = [];
    const dayStart = "09:00";
    const dayEnd = "18:00";

    // Check gap before first class
    const firstStart = sortedClasses[0].startTime;
    if (firstStart > dayStart) {
      freePeriods.push({
        start: dayStart,
        end: firstStart,
        duration: calculateMinutesBetween(dayStart, firstStart),
      });
    }

    // Check gaps between classes
    for (let i = 0; i < sortedClasses.length - 1; i++) {
      const currentEnd = sortedClasses[i].endTime;
      const nextStart = sortedClasses[i + 1].startTime;
      if (currentEnd < nextStart) {
        freePeriods.push({
          start: currentEnd,
          end: nextStart,
          duration: calculateMinutesBetween(currentEnd, nextStart),
        });
      }
    }

    // Check gap after last class
    const lastEnd = sortedClasses[sortedClasses.length - 1].endTime;
    if (lastEnd < dayEnd) {
      freePeriods.push({
        start: lastEnd,
        end: dayEnd,
        duration: calculateMinutesBetween(lastEnd, dayEnd),
      });
    }

    res.status(200).json({
      success: true,
      data: freePeriods,
    });
  } catch (error) {
    console.error("Error getting free periods:", error);
    res.status(500).json({
      success: false,
      message: "Error getting free periods",
      error: error.message,
    });
  }
};

// Student Exams endpoints
exports.getStudentExams = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const studentExams = await StudentExam.find({ user: userId })
      .sort({ examDate: 1, startTime: 1 });
    
    res.status(200).json({
      success: true,
      data: studentExams,
    });
  } catch (error) {
    console.error("Error fetching student exams:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student exams",
      error: error.message,
    });
  }
};

exports.createStudentExam = async (req, res) => {
  try {
    const userId = req.user._id;
    const examData = {
      ...req.body,
      user: userId,
    };
    
    const newExam = new StudentExam(examData);
    await newExam.save();
    
    res.status(201).json({
      success: true,
      message: "Student exam created successfully",
      data: newExam,
    });
  } catch (error) {
    console.error("Error creating student exam:", error);
    res.status(500).json({
      success: false,
      message: "Error creating student exam",
      error: error.message,
    });
  }
};

exports.updateStudentExam = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = {
      ...req.body,
      user: userId,
    };
    
    // Find and update the student exam (ensure it belongs to the user)
    // Convert both to string for reliable comparison
    const updatedExam = await StudentExam.findOneAndUpdate(
      { _id: id, user: userId.toString() },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedExam) {
      return res.status(404).json({
        success: false,
        message: "Student exam not found or you don't have permission to update it",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Student exam updated successfully",
      data: updatedExam,
    });
  } catch (error) {
    console.error("Error updating student exam:", error);
    res.status(500).json({
      success: false,
      message: "Error updating student exam",
      error: error.message,
    });
  }
};

exports.deleteStudentExam = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    console.log("Delete exam request - User ID:", userId);
    console.log("Delete exam request - Exam ID:", id);
    
    // First check if exam exists and get its user
    const existingExam = await StudentExam.findOne({ _id: id });
    if (existingExam) {
      console.log("Exam found - Exam user ID:", existingExam.user);
      console.log("User ID match:", existingExam.user.toString() === userId.toString());
    } else {
      console.log("Exam not found with ID:", id);
    }
    
    // Find and delete the student exam (ensure it belongs to the user)
    // Convert both to string for reliable comparison
    const deletedExam = await StudentExam.findOneAndDelete({
      _id: id,
      user: userId.toString()
    });
    
    if (!deletedExam) {
      return res.status(404).json({
        success: false,
        message: "Student exam not found or you don't have permission to delete it",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Student exam deleted successfully",
      data: deletedExam,
    });
  } catch (error) {
    console.error("Error deleting student exam:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting student exam",
      error: error.message,
    });
  }
};

// ==================== ENHANCED ATTENDANCE ENDPOINTS ====================

// Calculate bunk capacity
exports.calculateBunkCapacity = async (req, res) => {
  try {
    const userId = req.user._id;
    const requiredPercentage = req.query.required || 75;

    const attendance = await Attendance.findOne({ user: userId.toString() });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const bunkAnalysis = attendance.subjects.map((subject) => {
      const currentPercentage = subject.attendancePercentage;

      if (currentPercentage >= requiredPercentage) {
        // Can bunk formula: (attended - required%) * total / (100 - required%)
        const canBunk = Math.floor(
          (subject.classesAttended -
            (requiredPercentage / 100) * subject.totalClasses) /
            ((100 - requiredPercentage) / 100),
        );

        return {
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          currentPercentage: parseFloat(currentPercentage.toFixed(2)),
          totalClasses: subject.totalClasses,
          classesAttended: subject.classesAttended,
          canBunk: Math.max(0, canBunk),
          warning: "SAFE",
          warningColor: "#2ecc71",
        };
      } else {
        // Need to attend formula: (required% * total - attended) / attended
        const needAttend = Math.ceil(
          (requiredPercentage / 100) * (subject.totalClasses + 10) -
            subject.classesAttended,
        );

        return {
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          currentPercentage: parseFloat(currentPercentage.toFixed(2)),
          totalClasses: subject.totalClasses,
          classesAttended: subject.classesAttended,
          needToAttend: Math.max(0, needAttend),
          warning: "CRITICAL",
          warningColor: "#e74c3c",
        };
      }
    });

    res.status(200).json({
      success: true,
      data: bunkAnalysis,
    });
  } catch (error) {
    console.error("Error calculating bunk capacity:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating bunk capacity",
      error: error.message,
    });
  }
};

// Get attendance calendar for a subject
exports.getAttendanceCalendar = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subjectCode } = req.params;

    const attendance = await Attendance.findOne({ user: userId.toString() });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const subject = attendance.subjects.find(
      (s) => s.subjectCode === subjectCode,
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Group records by date and status
    const calendarData = {};

    subject.attendanceRecords.forEach((record) => {
      const dateStr = new Date(record.date).toISOString().split("T")[0];
      if (!calendarData[dateStr]) {
        calendarData[dateStr] = { status: record.status, notes: record.notes };
      }
    });

    res.status(200).json({
      success: true,
      data: {
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        calendar: calendarData,
        stats: {
          totalClasses: subject.totalClasses,
          attended: subject.classesAttended,
          absent: subject.classesSkipped,
          leave: subject.leaveClasses,
          cancelled: subject.cancelledClasses,
          percentage: parseFloat(subject.attendancePercentage.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error("Error getting attendance calendar:", error);
    res.status(500).json({
      success: false,
      message: "Error getting attendance calendar",
      error: error.message,
    });
  }
};

// ==================== EXAM SCHEDULE ENDPOINTS ====================

// Create exam schedule (Admin/Faculty)
exports.createExamSchedule = async (req, res) => {
  try {
    const { college, branch, semester, examType, examPeriod, exams } = req.body;

    if (!college || !branch || !semester || !examType || !exams) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const newSchedule = new ExamSchedule({
      college,
      branch,
      semester,
      examType,
      examPeriod,
      exams,
    });

    await newSchedule.save();

    res.status(201).json({
      success: true,
      message: "Exam schedule created successfully",
      data: newSchedule,
    });
  } catch (error) {
    console.error("Error creating exam schedule:", error);
    res.status(500).json({
      success: false,
      message: "Error creating exam schedule",
      error: error.message,
    });
  }
};

// Get exam schedule
exports.getExamSchedule = async (req, res) => {
  try {
    const { college, branch, semester, examType } = req.query;

    const query = {};
    if (college) query.college = college;
    if (branch) query.branch = branch;
    if (semester) query.semester = semester;
    if (examType) query.examType = examType;

    const schedules = await ExamSchedule.find(query);

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam schedule not found",
      });
    }

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error("Error fetching exam schedule:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching exam schedule",
      error: error.message,
    });
  }
};

// ==================== FACULTY ENDPOINTS ====================

// Get faculty info
exports.getFacultyInfo = async (req, res) => {
  try {
    const { name, email, subjectCode } = req.query;

    const query = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (email) query.email = email;
    if (subjectCode) query.subjects = subjectCode;

    const facultyList = await Faculty.find(query);

    res.status(200).json({
      success: true,
      data: facultyList,
    });
  } catch (error) {
    console.error("Error fetching faculty info:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculty info",
      error: error.message,
    });
  }
};

// ==================== HELPER FUNCTIONS ====================
