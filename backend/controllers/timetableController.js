const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, and, or, inArray, desc, asc, sql, like, ne, gte, lte } = require('drizzle-orm');

const now = () => new Date().toISOString();

const parseTime = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

// === COLLEGE TIMETABLES ===
exports.getCollegeTimetable = async (req, res) => {
  try {
    const { college, branch, semester } = req.query;
    if (!college || !branch || !semester) return res.status(400).json({ success: false, message: "College, branch, and semester are required" });
    const db = getDb();
    const timetables = await db.select().from(schema.collegeTimetables).where(and(eq(schema.collegeTimetables.college, college), eq(schema.collegeTimetables.branch, branch), eq(schema.collegeTimetables.semester, semester))).limit(1);
    const timetable = timetables[0];
    if (!timetable) return res.status(404).json({ success: false, message: "Timetable not found" });

    const schedules = await db.select().from(schema.timetableSchedules).where(eq(schema.timetableSchedules.timetableId, timetable.id));
    const scheduleIds = schedules.map(s => s.id);
    const classes = scheduleIds.length ? await db.select().from(schema.timetableClasses).where(inArray(schema.timetableClasses.scheduleId, scheduleIds)) : [];

    const classesBySchedule = {};
    for (const c of classes) { if (!classesBySchedule[c.scheduleId]) classesBySchedule[c.scheduleId] = []; classesBySchedule[c.scheduleId].push(c); }

    const data = { ...timetable, schedule: schedules.map(s => ({ ...s, classes: classesBySchedule[s.id] || [] })) };
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching timetable", error: error.message });
  }
};

exports.getAllCollegeTimetables = async (req, res) => {
  try {
    const timetables = await getDb().select().from(schema.collegeTimetables);
    res.status(200).json({ success: true, data: timetables });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching timetables", error: error.message });
  }
};

exports.createCollegeTimetable = async (req, res) => {
  try {
    const { college, branch, semester, schedule } = req.body;
    if (!college || !branch || !semester || !schedule) return res.status(400).json({ success: false, message: "All fields are required" });
    const db = getDb();
    const existing = await db.select().from(schema.collegeTimetables).where(and(eq(schema.collegeTimetables.college, college), eq(schema.collegeTimetables.branch, branch), eq(schema.collegeTimetables.semester, semester))).limit(1);
    if (existing.length) return res.status(400).json({ success: false, message: "Timetable already exists" });

    const ttId = crypto.randomUUID();
    await db.insert(schema.collegeTimetables).values({ id: ttId, college, branch, semester });
    for (const day of schedule) {
      const sId = crypto.randomUUID();
      await db.insert(schema.timetableSchedules).values({ id: sId, timetableId: ttId, day: day.day });
      if (day.classes) {
        for (const cls of day.classes) {
          await db.insert(schema.timetableClasses).values({ id: crypto.randomUUID(), scheduleId: sId, timeSlot: cls.timeSlot || null, subject: cls.subject || null, subjectCode: cls.subjectCode || null, professor: cls.professor || null, room: cls.room || null, type: cls.type || null });
        }
      }
    }
    res.status(201).json({ success: true, message: "Timetable created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating timetable", error: error.message });
  }
};

exports.updateCollegeTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { schedule } = req.body;
    if (!schedule) return res.status(400).json({ success: false, message: "Schedule data is required" });
    const db = getDb();
    const existing = await db.select().from(schema.collegeTimetables).where(eq(schema.collegeTimetables.id, id)).limit(1);
    if (!existing.length) return res.status(404).json({ success: false, message: "Timetable not found" });

    const oldSchedules = await db.select().from(schema.timetableSchedules).where(eq(schema.timetableSchedules.timetableId, id));
    const oldIds = oldSchedules.map(s => s.id);
    if (oldIds.length) {
      await db.delete(schema.timetableClasses).where(inArray(schema.timetableClasses.scheduleId, oldIds));
      await db.delete(schema.timetableSchedules).where(inArray(schema.timetableSchedules.id, oldIds));
    }
    for (const day of schedule) {
      const sId = crypto.randomUUID();
      await db.insert(schema.timetableSchedules).values({ id: sId, timetableId: id, day: day.day });
      if (day.classes) {
        for (const cls of day.classes) {
          await db.insert(schema.timetableClasses).values({ id: crypto.randomUUID(), scheduleId: sId, timeSlot: cls.timeSlot || null, subject: cls.subject || null, subjectCode: cls.subjectCode || null, professor: cls.professor || null, room: cls.room || null, type: cls.type || null });
        }
      }
    }
    res.json({ success: true, message: "Timetable updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating timetable", error: error.message });
  }
};

// === PERSONAL TIMETABLES ===
exports.getPersonalTimetable = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const timetables = await db.select().from(schema.personalTimetables).where(eq(schema.personalTimetables.userId, userId)).limit(1);
    const timetable = timetables[0];
    if (!timetable) return res.status(200).json({ success: true, data: null });

    const schedules = await db.select().from(schema.personalSchedules).where(eq(schema.personalSchedules.timetableId, timetable.id));
    const scheduleIds = schedules.map(s => s.id);
    const classes = scheduleIds.length ? await db.select().from(schema.personalClasses).where(inArray(schema.personalClasses.scheduleId, scheduleIds)) : [];

    const classesBySchedule = {};
    for (const c of classes) { if (!classesBySchedule[c.scheduleId]) classesBySchedule[c.scheduleId] = []; classesBySchedule[c.scheduleId].push(c); }

    const data = { ...timetable, colorScheme: timetable.colorScheme ? JSON.parse(timetable.colorScheme) : { LECTURE: '#3498db', LAB: '#2ecc71', TUTORIAL: '#e74c3c' }, schedule: schedules.map(s => ({ ...s, classes: classesBySchedule[s.id] || [] })) };
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching personal timetable", error: error.message });
  }
};

exports.updatePersonalTimetable = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { schedule, colorScheme, viewMode } = req.body;
    const db = getDb();
    let timetables = await db.select().from(schema.personalTimetables).where(eq(schema.personalTimetables.userId, userId)).limit(1);
    let timetable = timetables[0];

    if (!timetable) {
      const id = crypto.randomUUID();
      await db.insert(schema.personalTimetables).values({ id, userId, colorScheme: colorScheme ? JSON.stringify(colorScheme) : null, viewMode: viewMode || 'WEEK' });
      timetable = (await db.select().from(schema.personalTimetables).where(eq(schema.personalTimetables.id, id)).limit(1))[0];
    } else {
      const updates = {};
      if (colorScheme) updates.colorScheme = JSON.stringify(colorScheme);
      if (viewMode) updates.viewMode = viewMode;
      if (Object.keys(updates).length) await db.update(schema.personalTimetables).set(updates).where(eq(schema.personalTimetables.id, timetable.id));
    }

    if (schedule) {
      const oldSchedules = await db.select().from(schema.personalSchedules).where(eq(schema.personalSchedules.timetableId, timetable.id));
      const oldIds = oldSchedules.map(s => s.id);
      if (oldIds.length) {
        await db.delete(schema.personalClasses).where(inArray(schema.personalClasses.scheduleId, oldIds));
        await db.delete(schema.personalSchedules).where(inArray(schema.personalSchedules.id, oldIds));
      }
      for (const day of schedule) {
        const sId = crypto.randomUUID();
        await db.insert(schema.personalSchedules).values({ id: sId, timetableId: timetable.id, day: day.day });
        if (day.classes) {
          for (const cls of day.classes) {
            await db.insert(schema.personalClasses).values({ id: crypto.randomUUID(), scheduleId: sId, timeSlot: cls.timeSlot || null, startTime: cls.startTime || null, endTime: cls.endTime || null, subject: cls.subject || null, subjectCode: cls.subjectCode || null, type: cls.type || null, customNote: cls.customNote || null, color: cls.color || '#3498db', isEdited: cls.isEdited ? 1 : 0, isOptional: cls.isOptional ? 1 : 0, notificationsEnabled: cls.notificationsEnabled ? 1 : 0, notificationTimes: cls.notificationTimes ? JSON.stringify(cls.notificationTimes) : null });
          }
        }
      }
    }

    res.json({ success: true, message: "Personal timetable updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating personal timetable", error: error.message });
  }
};

// === ATTENDANCE ===
exports.getAttendance = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    let attRecords = await db.select().from(schema.attendance).where(eq(schema.attendance.userId, userId)).limit(1);
    if (!attRecords.length) {
      const id = crypto.randomUUID();
      await db.insert(schema.attendance).values({ id, userId });
      attRecords = await db.select().from(schema.attendance).where(eq(schema.attendance.id, id)).limit(1);
    }
    const att = attRecords[0];
    const subjects = await db.select().from(schema.attendanceSubjects).where(eq(schema.attendanceSubjects.attendanceId, att.id));
    const subjectIds = subjects.map(s => s.id);
    const records = subjectIds.length ? await db.select().from(schema.attendanceRecords).where(inArray(schema.attendanceRecords.subjectId, subjectIds)) : [];

    const recordsBySubject = {};
    for (const r of records) { if (!recordsBySubject[r.subjectId]) recordsBySubject[r.subjectId] = []; recordsBySubject[r.subjectId].push(r); }

    const result = { ...att, subjects: subjects.map(s => ({ ...s, attendancePercentage: s.totalClasses > 0 ? Math.round((s.classesAttended / s.totalClasses) * 100) : 0, attendanceRecords: recordsBySubject[s.id] || [] })) };
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance", error: error.message });
  }
};

exports.addSubjectAttendance = async (req, res) => {
  try {
    const { subjectCode, subjectName } = req.body;
    if (!subjectCode || !subjectName) return res.status(400).json({ message: "Subject code and name required" });
    const userId = req.user._id || req.user.id;
    const db = getDb();
    let attRecords = await db.select().from(schema.attendance).where(eq(schema.attendance.userId, userId)).limit(1);
    if (!attRecords.length) { const id = crypto.randomUUID(); await db.insert(schema.attendance).values({ id, userId }); attRecords = await db.select().from(schema.attendance).where(eq(schema.attendance.id, id)).limit(1); }
    const att = attRecords[0];
    const existing = await db.select().from(schema.attendanceSubjects).where(and(eq(schema.attendanceSubjects.attendanceId, att.id), eq(schema.attendanceSubjects.subjectCode, subjectCode))).limit(1);
    if (existing.length) return res.status(400).json({ message: "Subject already exists" });
    const subId = crypto.randomUUID();
    await db.insert(schema.attendanceSubjects).values({ id: subId, attendanceId: att.id, subjectCode, subjectName });
    res.status(201).json({ message: "Subject added", subjectId: subId });
  } catch (error) {
    res.status(500).json({ message: "Error adding subject", error: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { subjectCode, date, timeSlot, status } = req.body;
    if (!subjectCode || !date || !status) return res.status(400).json({ message: "Subject code, date, and status are required" });
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const attRecords = await db.select().from(schema.attendance).where(eq(schema.attendance.userId, userId)).limit(1);
    if (!attRecords.length) return res.status(404).json({ message: "Attendance record not found" });
    const subjects = await db.select().from(schema.attendanceSubjects).where(and(eq(schema.attendanceSubjects.attendanceId, attRecords[0].id), eq(schema.attendanceSubjects.subjectCode, subjectCode))).limit(1);
    if (!subjects.length) return res.status(404).json({ message: "Subject not found" });
    const sub = subjects[0];

    const existing = await db.select().from(schema.attendanceRecords).where(and(eq(schema.attendanceRecords.subjectId, sub.id), eq(schema.attendanceRecords.date, date), eq(schema.attendanceRecords.timeSlot, timeSlot || ''))).limit(1);
    if (existing.length) {
      await db.update(schema.attendanceRecords).set({ status }).where(eq(schema.attendanceRecords.id, existing[0].id));
    } else {
      await db.insert(schema.attendanceRecords).values({ id: crypto.randomUUID(), subjectId: sub.id, date, timeSlot: timeSlot || null, status, markedAt: now(), markedBy: userId });
    }

    const totalClasses = await db.select({ count: sql`COUNT(*)` }).from(schema.attendanceRecords).where(eq(schema.attendanceRecords.subjectId, sub.id));
    const classesAttended = await db.select({ count: sql`COUNT(*)` }).from(schema.attendanceRecords).where(and(eq(schema.attendanceRecords.subjectId, sub.id), eq(schema.attendanceRecords.status, 'PRESENT')));
    const classesSkipped = await db.select({ count: sql`COUNT(*)` }).from(schema.attendanceRecords).where(and(eq(schema.attendanceRecords.subjectId, sub.id), eq(schema.attendanceRecords.status, 'ABSENT')));

    await db.update(schema.attendanceSubjects).set({
      totalClasses: parseInt(totalClasses[0].count), classesAttended: parseInt(classesAttended[0].count),
      classesSkipped: parseInt(classesSkipped[0].count), lastUpdated: now(),
    }).where(eq(schema.attendanceSubjects.id, sub.id));

    res.json({ message: "Attendance marked" });
  } catch (error) {
    res.status(500).json({ message: "Error marking attendance", error: error.message });
  }
};

exports.getAttendanceStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const attRecords = await db.select().from(schema.attendance).where(eq(schema.attendance.userId, userId)).limit(1);
    if (!attRecords.length) return res.json({ subjects: [] });
    const subjects = await db.select().from(schema.attendanceSubjects).where(eq(schema.attendanceSubjects.attendanceId, attRecords[0].id));

    const stats = subjects.map(s => ({
      ...s, attendancePercentage: s.totalClasses > 0 ? Math.round((s.classesAttended / s.totalClasses) * 100) : 0,
      canBunk: s.totalClasses > 0 ? Math.floor(((s.classesAttended / s.totalClasses) * 100 - 75) / 100 * s.totalClasses) : 0,
      needToAttend: s.totalClasses > 0 ? Math.ceil(((75 - (s.classesAttended / s.totalClasses) * 100) / 100) * s.totalClasses) : 0,
      warningStatus: s.totalClasses > 0 ? (s.classesAttended / s.totalClasses) * 100 >= 75 ? 'SAFE' : (s.classesAttended / s.totalClasses) * 100 >= 60 ? 'WARNING' : 'CRITICAL' : 'SAFE',
    }));

    const overallPercentage = subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + (s.totalClasses > 0 ? (s.classesAttended / s.totalClasses) * 100 : 0), 0) / subjects.length) : 0;
    const atRisk = stats.filter(s => s.warningStatus !== 'SAFE').map(s => s.subjectCode);
    const riskLevel = atRisk.length === 0 ? 'LOW' : (atRisk.length <= subjects.length / 2 ? 'MEDIUM' : 'HIGH');

    res.json({ subjects: stats, attendanceSummary: { overallPercentage, atRiskSubjects: atRisk, riskLevel } });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
};

exports.deleteSubjectAttendance = async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const attRecords = await db.select().from(schema.attendance).where(eq(schema.attendance.userId, userId)).limit(1);
    if (!attRecords.length) return res.status(404).json({ message: "Not found" });
    const subjects = await db.select().from(schema.attendanceSubjects).where(and(eq(schema.attendanceSubjects.attendanceId, attRecords[0].id), eq(schema.attendanceSubjects.subjectCode, subjectCode))).limit(1);
    if (!subjects.length) return res.status(404).json({ message: "Subject not found" });
    await db.delete(schema.attendanceRecords).where(eq(schema.attendanceRecords.subjectId, subjects[0].id));
    await db.delete(schema.attendanceSubjects).where(eq(schema.attendanceSubjects.id, subjects[0].id));
    res.json({ message: "Subject deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subject", error: error.message });
  }
};

// === SCHEDULE HELPERS ===
exports.getTodaySchedule = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const timetables = await db.select().from(schema.personalTimetables).where(eq(schema.personalTimetables.userId, userId)).limit(1);
    if (!timetables.length) return res.json({ classes: [] });
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const schedules = await db.select().from(schema.personalSchedules).where(and(eq(schema.personalSchedules.timetableId, timetables[0].id), eq(schema.personalSchedules.day, dayName))).limit(1);
    if (!schedules.length) return res.json({ classes: [] });
    const classes = await db.select().from(schema.personalClasses).where(eq(schema.personalClasses.scheduleId, schedules[0].id));
    res.json({ day: dayName, classes });
  } catch (error) {
    res.status(500).json({ message: "Error fetching today's schedule", error: error.message });
  }
};

exports.getCurrentClass = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const timetables = await db.select().from(schema.personalTimetables).where(eq(schema.personalTimetables.userId, userId)).limit(1);
    if (!timetables.length) return res.json({ currentClass: null });
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const schedules = await db.select().from(schema.personalSchedules).where(and(eq(schema.personalSchedules.timetableId, timetables[0].id), eq(schema.personalSchedules.day, dayName))).limit(1);
    if (!schedules.length) return res.json({ currentClass: null });

    const classes = await db.select().from(schema.personalClasses).where(eq(schema.personalClasses.scheduleId, schedules[0].id));
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    let currentClass = null;
    for (const cls of classes) {
      const start = parseTime(cls.startTime);
      const end = parseTime(cls.endTime);
      if (nowMin >= start && nowMin <= end) { currentClass = cls; break; }
    }
    const nextClass = classes.filter(c => parseTime(c.startTime) > nowMin).sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))[0] || null;
    res.json({ currentClass, nextClass });
  } catch (error) {
    res.status(500).json({ message: "Error fetching current class", error: error.message });
  }
};

exports.addPersonalClass = async (req, res) => {
  try {
    const { day, timeSlot, startTime, endTime, subject, subjectCode, type, customNote, color } = req.body;
    if (!day || !startTime || !endTime || !subject) return res.status(400).json({ message: "Day, startTime, endTime, and subject are required" });
    const userId = req.user._id || req.user.id;
    const db = getDb();
    let timetables = await db.select().from(schema.personalTimetables).where(eq(schema.personalTimetables.userId, userId)).limit(1);
    if (!timetables.length) { const id = crypto.randomUUID(); await db.insert(schema.personalTimetables).values({ id, userId }); timetables = await db.select().from(schema.personalTimetables).where(eq(schema.personalTimetables.id, id)).limit(1); }
    let schedules = await db.select().from(schema.personalSchedules).where(and(eq(schema.personalSchedules.timetableId, timetables[0].id), eq(schema.personalSchedules.day, day))).limit(1);
    if (!schedules.length) { const sId = crypto.randomUUID(); await db.insert(schema.personalSchedules).values({ id: sId, timetableId: timetables[0].id, day }); schedules = await db.select().from(schema.personalSchedules).where(eq(schema.personalSchedules.id, sId)).limit(1); }
    const clsId = crypto.randomUUID();
    await db.insert(schema.personalClasses).values({ id: clsId, scheduleId: schedules[0].id, timeSlot: timeSlot || null, startTime, endTime, subject, subjectCode: subjectCode || null, type: type || null, customNote: customNote || null, color: color || '#3498db' });
    const cls = (await db.select().from(schema.personalClasses).where(eq(schema.personalClasses.id, clsId)).limit(1))[0];
    res.status(201).json(cls);
  } catch (error) {
    res.status(500).json({ message: "Error adding class", error: error.message });
  }
};

exports.editPersonalClass = async (req, res) => {
  try {
    const { day, classId } = req.params;
    const updates = req.body;
    delete updates.day; delete updates.classId;
    const userId = req.user._id || req.user.id;
    const db = getDb();
    if (updates.colorScheme) updates.colorScheme = JSON.stringify(updates.colorScheme);
    if (updates.notificationTimes) updates.notificationTimes = JSON.stringify(updates.notificationTimes);
    if (updates.isEdited !== undefined) updates.isEdited = updates.isEdited ? 1 : 0;
    if (updates.isOptional !== undefined) updates.isOptional = updates.isOptional ? 1 : 0;
    if (updates.notificationsEnabled !== undefined) updates.notificationsEnabled = updates.notificationsEnabled ? 1 : 0;
    updates.editedAt = now();
    await db.update(schema.personalClasses).set(updates).where(eq(schema.personalClasses.id, classId));
    res.json({ message: "Class updated" });
  } catch (error) {
    res.status(500).json({ message: "Error updating class", error: error.message });
  }
};

exports.deletePersonalClass = async (req, res) => {
  try {
    const { day, classId } = req.params;
    const userId = req.user._id || req.user.id;
    const db = getDb();
    await db.delete(schema.personalClasses).where(eq(schema.personalClasses.id, classId));
    res.json({ message: "Class deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting class", error: error.message });
  }
};

exports.getFreePeriods = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const timetables = await db.select().from(schema.personalTimetables).where(eq(schema.personalTimetables.userId, userId)).limit(1);
    if (!timetables.length) return res.json({ freePeriods: [] });
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const schedules = await db.select().from(schema.personalSchedules).where(and(eq(schema.personalSchedules.timetableId, timetables[0].id), eq(schema.personalSchedules.day, dayName))).limit(1);
    if (!schedules.length) return res.json({ freePeriods: [] });
    const classes = await db.select().from(schema.personalClasses).where(eq(schema.personalClasses.scheduleId, schedules[0].id)).orderBy(asc(schema.personalClasses.startTime));
    const allSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const busySlots = new Set();
    for (const cls of classes) {
      const start = parseTime(cls.startTime);
      const end = parseTime(cls.endTime);
      for (const slot of allSlots) { const s = parseTime(slot); if (s >= start && s < end) busySlots.add(slot); }
    }
    const freePeriods = allSlots.filter(s => !busySlots.has(s));
    res.json({ freePeriods, busySlots: [...busySlots].sort() });
  } catch (error) {
    res.status(500).json({ message: "Error fetching free periods", error: error.message });
  }
};

// === EXAMS ===
exports.getStudentExams = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const exams = await db.select().from(schema.studentExams).where(eq(schema.studentExams.userId, userId)).orderBy(desc(schema.studentExams.createdAt));
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exams", error: error.message });
  }
};

exports.createStudentExam = async (req, res) => {
  try {
    const { subject, subjectCode, examDate, startTime, endTime, duration, room, building, totalMarks, instructions, type, status } = req.body;
    if (!subject || !subjectCode || !examDate || !startTime || !endTime || !duration) return res.status(400).json({ message: "Missing required fields" });
    const userId = req.user._id || req.user.id;
    const id = crypto.randomUUID();
    await getDb().insert(schema.studentExams).values({ id, userId, subject, subjectCode, examDate, startTime, endTime, duration: parseInt(duration), room: room || null, building: building || null, totalMarks: totalMarks || null, instructions: instructions || null, type: type || 'EXTERNAL', status: status || 'UPCOMING', createdAt: now(), updatedAt: now() });
    const exam = (await getDb().select().from(schema.studentExams).where(eq(schema.studentExams.id, id)).limit(1))[0];
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: "Error creating exam", error: error.message });
  }
};

exports.updateStudentExam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const existing = await db.select().from(schema.studentExams).where(and(eq(schema.studentExams.id, id), eq(schema.studentExams.userId, userId))).limit(1);
    if (!existing.length) return res.status(404).json({ message: "Exam not found" });
    const updates = { ...req.body, updatedAt: now() };
    delete updates.id; delete updates.userId;
    if (updates.duration) updates.duration = parseInt(updates.duration);
    if (updates.notificationTimes && typeof updates.notificationTimes !== 'string') updates.notificationTimes = JSON.stringify(updates.notificationTimes);
    await db.update(schema.studentExams).set(updates).where(eq(schema.studentExams.id, id));
    res.json({ message: "Exam updated" });
  } catch (error) {
    res.status(500).json({ message: "Error updating exam", error: error.message });
  }
};

exports.deleteStudentExam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const db = getDb();
    await db.delete(schema.studentExams).where(and(eq(schema.studentExams.id, id), eq(schema.studentExams.userId, userId)));
    res.json({ message: "Exam deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting exam", error: error.message });
  }
};

// === BUNK CAPACITY ===
exports.calculateBunkCapacity = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const attRecords = await db.select().from(schema.attendance).where(eq(schema.attendance.userId, userId)).limit(1);
    if (!attRecords.length) return res.json({ subjects: [] });
    const subjects = await db.select().from(schema.attendanceSubjects).where(eq(schema.attendanceSubjects.attendanceId, attRecords[0].id));
    const result = subjects.map(s => {
      const attended = s.classesAttended || 0;
      const total = s.totalClasses || 0;
      const currentPercent = total > 0 ? (attended / total) * 100 : 0;
      const requiredPercent = 75;

      let canBunk = 0;
      while (canBunk >= 0) {
        const newPercent = (attended / (total + canBunk + 1)) * 100;
        if (newPercent >= requiredPercent) canBunk++;
        else break;
      }

      let needToAttend = 0;
      while (needToAttend < 100) {
        const newPercent = ((attended + needToAttend) / (total + needToAttend)) * 100;
        if (newPercent >= requiredPercent) break;
        needToAttend++;
      }

      return {
        subjectCode: s.subjectCode, subjectName: s.subjectName,
        totalClasses: total, classesAttended: attended,
        currentPercentage: Math.round(currentPercent),
        canBunk: Math.max(0, canBunk), needToAttend: Math.max(0, needToAttend),
        status: currentPercent >= 75 ? 'SAFE' : (currentPercent >= 60 ? 'WARNING' : 'CRITICAL'),
      };
    });
    res.json({ subjects: result });
  } catch (error) {
    res.status(500).json({ message: "Error calculating bunk capacity", error: error.message });
  }
};

// === ATTENDANCE CALENDAR ===
exports.getAttendanceCalendar = async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const userId = req.user._id || req.user.id;
    const db = getDb();
    const attRecords = await db.select().from(schema.attendance).where(eq(schema.attendance.userId, userId)).limit(1);
    if (!attRecords.length) return res.json({ records: [] });
    const subjects = await db.select().from(schema.attendanceSubjects).where(and(eq(schema.attendanceSubjects.attendanceId, attRecords[0].id), eq(schema.attendanceSubjects.subjectCode, subjectCode))).limit(1);
    if (!subjects.length) return res.json({ records: [] });
    const records = await db.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.subjectId, subjects[0].id)).orderBy(desc(schema.attendanceRecords.date));
    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching calendar", error: error.message });
  }
};

exports.createExamSchedule = async (req, res) => {
  const { subject, subjectCode, examDate, startTime, endTime, duration, room, building, totalMarks, instructions, type, status } = req.body;
  if (!subject || !subjectCode || !examDate || !startTime || !endTime || !duration) return res.status(400).json({ message: "Missing required fields" });
  const userId = req.user._id || req.user.id;
  const id = crypto.randomUUID();
  await getDb().insert(schema.studentExams).values({ id, userId, subject, subjectCode, examDate, startTime, endTime, duration: parseInt(duration), room: room || null, building: building || null, totalMarks: totalMarks || null, instructions: instructions || null, type: type || 'EXTERNAL', status: status || 'UPCOMING', createdAt: now(), updatedAt: now() });
  const exam = (await getDb().select().from(schema.studentExams).where(eq(schema.studentExams.id, id)).limit(1))[0];
  res.status(201).json(exam);
};

exports.getExamSchedule = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const exams = await getDb().select().from(schema.studentExams).where(eq(schema.studentExams.userId, userId)).orderBy(asc(schema.studentExams.examDate));
  res.json(exams);
};

exports.getFacultyInfo = async (req, res) => {
  const { department } = req.query;
  if (!department) return res.status(400).json({ message: "Department is required" });
  const db = getDb();
  const classes = await db.select({
    professor: schema.timetableClasses.professor, subject: schema.timetableClasses.subject,
    subjectCode: schema.timetableClasses.subjectCode,
  }).from(schema.timetableClasses).where(eq(schema.timetableClasses.professor, department))
    .groupBy(schema.timetableClasses.professor);
  res.json(classes);
};
