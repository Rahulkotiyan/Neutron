# Quick Reference - Timetable & Attendance API

## 🚀 Quick Start

### Import in React Component

```jsx
import axios from "axios";

const token = localStorage.getItem("token");
const headers = { Authorization: `Bearer ${token}` };
```

---

## 📋 API Quick Reference

### Timetable Endpoints

#### Get Personal Timetable

```javascript
GET /api/timetable/personal
Response: { success: true, data: PersonalTimetable }
```

#### Add Class

```javascript
POST /api/timetable/personal/class
Body: {
  day: "Monday",
  startTime: "09:00",
  endTime: "10:30",
  subject: "Data Structures",
  subjectCode: "CS201",
  professor: "Dr. Smith",
  room: "101",
  type: "LECTURE",
  color: "#3498db"
}
```

#### Get Today's Classes

```javascript
GET /api/timetable/personal/today
Response: { day: "Monday", classes: [...] }
```

#### Get Current Class

```javascript
GET /api/timetable/personal/current-class
Response: { current: ClassObject, next: ClassObject }
```

#### Get Free Periods

```javascript
GET /api/timetable/personal/free-periods
Response: [
  { start: "10:30", end: "11:30", duration: 60 },
  ...
]
```

---

### Attendance Endpoints

#### Get Attendance

```javascript
GET /api/timetable/attendance
Response: { success: true, data: AttendanceObject }
```

#### Add Subject

```javascript
POST /api/timetable/attendance/subject
Body: {
  subjectCode: "CS201",
  subjectName: "Data Structures"
}
```

#### Mark Attendance

```javascript
POST /api/timetable/attendance/mark
Body: {
  subjectCode: "CS201",
  date: "2026-02-14",
  timeSlot: "09:00-10:30",
  status: "PRESENT", // or ABSENT, LEAVE
  notes: "Optional"
}
```

#### Get Bunk Analysis

```javascript
GET /api/timetable/attendance/bunk-capacity?required=75
Response: [
  {
    subjectCode: "CS201",
    currentPercentage: 80,
    canBunk: 3,
    warning: "SAFE"
  },
  ...
]
```

#### Get Attendance Calendar

```javascript
GET /api/timetable/attendance/calendar/:subjectCode
Response: {
  subjectCode: "CS201",
  calendar: { "2026-02-14": { status: "PRESENT" }, ... },
  stats: { totalClasses: 20, attended: 16, ... }
}
```

---

### Exam Endpoints

#### Create Exam Schedule (Admin)

```javascript
POST /api/timetable/exam-schedule
Body: {
  college: "AIT Bangalore",
  branch: "CSE",
  semester: "5",
  examType: "FINAL",
  examPeriod: {
    startDate: "2026-05-01",
    endDate: "2026-05-30"
  },
  exams: [...]
}
```

#### Get Exam Schedule

```javascript
GET /api/timetable/exam-schedule?college=AIT&branch=CSE&semester=5
Response: [ExamSchedule, ...]
```

---

### Faculty Endpoints

#### Get Faculty Info

```javascript
GET /api/timetable/faculty?name=Smith
GET /api/timetable/faculty?email=smith@college.edu
GET /api/timetable/faculty?subjectCode=CS201
```

---

## 💾 Data Structures

### Class Object

```javascript
{
  _id: ObjectId,
  timeSlot: "09:00 - 10:30",
  startTime: "09:00",
  endTime: "10:30",
  subject: "Data Structures",
  subjectCode: "CS201",
  professor: "Dr. Smith",
  professorEmail: "smith@college.edu",
  room: "101",
  building: "Building A",
  type: "LECTURE",
  color: "#3498db",
  customNote: "string",
  isEdited: boolean,
  notificationsEnabled: boolean
}
```

### Subject Attendance

```javascript
{
  subjectCode: "CS201",
  subjectName: "Data Structures",
  totalClasses: 20,
  classesAttended: 16,
  classesSkipped: 4,
  attendancePercentage: 80,
  canBunk: 3,
  needToAttend: 0,
  warningStatus: "SAFE",
  colorCode: "#2ecc71"
}
```

### Exam Object

```javascript
{
  subject: "Data Structures",
  subjectCode: "CS201",
  examDate: "2026-05-15",
  startTime: "09:00 AM",
  endTime: "12:00 PM",
  location: "Main Campus",
  room: "H-101",
  duration: 180,
  totalMarks: 100,
  instructions: "string"
}
```

---

## 🎨 Color Codes

### Class Types

```javascript
LECTURE: "#3498db"; // Blue
LAB: "#2ecc71"; // Green
TUTORIAL: "#e74c3c"; // Red
```

### Attendance Status

```javascript
>= 75%: "#2ecc71"   // Green (SAFE)
65-74%: "#f39c12"   // Yellow (WARNING)
< 65%: "#e74c3c"    // Red (CRITICAL)
```

---

## 📱 Component Quick Use

### TimetablePageEnhanced

```jsx
import TimetablePageEnhanced from "./components/TimetablePageEnhanced";

<TimetablePageEnhanced isSidebarOpen={true} currentUser={user} token={token} />;
```

### AttendanceTracker

```jsx
import AttendanceTracker from "./components/AttendanceTracker";

<AttendanceTracker token={token} />;
```

### Widgets for Dashboard

```jsx
import TimetableWidget from "./components/TimetableWidget";
import AttendanceWidget from "./components/AttendanceWidget";

<div className="grid grid-cols-2">
  <TimetableWidget token={token} currentUser={user} />
  <AttendanceWidget token={token} />
</div>;
```

---

## 🔧 Common Operations

### Add Class with Notification

```javascript
const addClass = async (classData) => {
  await axios.post(
    "/api/timetable/personal/class",
    {
      ...classData,
      notificationsEnabled: true,
      notificationTimes: [10, 30], // 10 & 30 mins before
    },
    { headers },
  );
};
```

### Mark Attendance (Batch)

```javascript
const markBatch = async (subjectCode, dates) => {
  for (const date of dates) {
    await axios.post(
      "/api/timetable/attendance/mark",
      {
        subjectCode,
        date,
        status: "PRESENT",
      },
      { headers },
    );
  }
};
```

### Get Daily Summary

```javascript
const getDailySummary = async () => {
  const [today, current, free] = await Promise.all([
    axios.get("/api/timetable/personal/today", { headers }),
    axios.get("/api/timetable/personal/current-class", { headers }),
    axios.get("/api/timetable/personal/free-periods", { headers }),
  ]);
  return { today: today.data, current: current.data, free: free.data };
};
```

### Get Attendance Report

```javascript
const getReport = async () => {
  const [attendance, bunk] = await Promise.all([
    axios.get("/api/timetable/attendance", { headers }),
    axios.get("/api/timetable/attendance/bunk-capacity", { headers }),
  ]);
  return { attendance: attendance.data, bunk: bunk.data };
};
```

---

## ⚠️ Error Handling

```javascript
try {
  const response = await axios.get(endpoint, { headers });
  return response.data.data;
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - token expired
    redirect("/login");
  } else if (error.response?.status === 404) {
    // Not found
    console.error("Resource not found");
  } else {
    // Other errors
    console.error(error.message);
  }
}
```

---

## 📊 Useful Calculations

### Bunk Capacity

```javascript
const canBunk = (attended, total, required = 75) => {
  if ((attended / total) * 100 >= required) {
    return Math.floor(
      (attended - (required / 100) * total) / ((100 - required) / 100),
    );
  }
  return 0;
};
```

### Need to Attend

```javascript
const needAttend = (attended, total, required = 75) => {
  const needed = Math.ceil((required / 100) * (total + 10) - attended);
  return Math.max(0, needed);
};
```

### Overall Percentage

```javascript
const percentage = (attended, total) => {
  return total > 0 ? parseFloat(((attended / total) * 100).toFixed(2)) : 0;
};
```

---

## 🔐 Required Headers

```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

---

## 📝 Common Response Format

**Success:**

```json
{
  "success": true,
  "data": {
    /* actual data */
  }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description",
  "error": "error details"
}
```

---

## 🎯 Key Thresholds

| Percentage | Status   | Color     |
| ---------- | -------- | --------- |
| ≥ 75%      | SAFE     | 🟢 Green  |
| 65-74%     | WARNING  | 🟡 Yellow |
| < 65%      | CRITICAL | 🔴 Red    |

---

## 📚 File Locations

| File                                            | Purpose           |
| ----------------------------------------------- | ----------------- |
| `backend/models/Schema.js`                      | Data schemas      |
| `backend/controllers/timetableController.js`    | API logic         |
| `backend/routes/timetableRoutes.js`             | Route definitions |
| `frontend/components/TimetablePageEnhanced.jsx` | Main UI           |
| `frontend/components/AttendanceTracker.jsx`     | Attendance UI     |
| `frontend/components/TimetableWidget.jsx`       | Dashboard widget  |
| `frontend/components/AttendanceWidget.jsx`      | Dashboard widget  |

---

## 🚀 Deployment Commands

```bash
# Backend
npm install
npm start          # Production
npm run dev        # Development

# Frontend
npm install
npm run build
npm run preview
```

---

**Version**: 1.0.0
**Updated**: February 2026
**Status**: ✅ Production Ready
