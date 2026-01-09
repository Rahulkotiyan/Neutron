const {
  CollegeTimetable,
  PersonalTimetable,
  Attendance,
  User,
} = require("../models/Schema");

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
      { new: true }
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
    const userId = req.user.id;

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
    const userId = req.user.id;
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
    const userId = req.user.id;

    let attendance = await Attendance.findOne({ user: userId });

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
    const userId = req.user.id;
    const { subjectCode, subjectName } = req.body;

    if (!subjectCode || !subjectName) {
      return res.status(400).json({
        success: false,
        message: "Subject code and name are required",
      });
    }

    let attendance = await Attendance.findOne({ user: userId });

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
      (s) => s.subjectCode === subjectCode
    );

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject already added",
      });
    }

    attendance.subjects.push({
      subjectCode,
      subjectName,
      totalClasses: 0,
      classesAttended: 0,
      classesSkipped: 0,
      attendanceRecords: [],
    });

    await attendance.save();

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
    const userId = req.user.id;
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

    let attendance = await Attendance.findOne({ user: userId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found. Add a subject first.",
      });
    }

    const subject = attendance.subjects.find(
      (s) => s.subjectCode === subjectCode
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
    const userId = req.user.id;

    const attendance = await Attendance.findOne({ user: userId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Calculate overall stats
    const totalClasses = attendance.subjects.reduce(
      (sum, s) => sum + s.totalClasses,
      0
    );
    const totalAttended = attendance.subjects.reduce(
      (sum, s) => sum + s.classesAttended,
      0
    );
    const totalSkipped = attendance.subjects.reduce(
      (sum, s) => sum + s.classesSkipped,
      0
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
            1
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
            subject.classesAttended
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
    const userId = req.user.id;
    const { subjectCode } = req.params;

    const attendance = await Attendance.findOne({ user: userId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    attendance.subjects = attendance.subjects.filter(
      (s) => s.subjectCode !== subjectCode
    );

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
