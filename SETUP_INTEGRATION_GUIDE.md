# Timetable & Attendance System - Setup & Integration Guide

## Quick Start

### Backend Setup

The system is already integrated into your backend. No additional installation needed!

#### Required Files (Already Created/Updated):

- ✅ Backend Models: `models/Schema.js` (Enhanced)
- ✅ Controllers: `controllers/timetableController.js` (Enhanced)
- ✅ Routes: `routes/timetableRoutes.js` (Enhanced)

### Frontend Setup

#### Step 1: Add New Components to Your Project

The following components have been created:

1. **TimetablePageEnhanced.jsx** - Main timetable interface
2. **AttendanceTracker.jsx** - Attendance tracking component
3. **TimetableWidget.jsx** - Dashboard widget
4. **AttendanceWidget.jsx** - Dashboard attendance widget

#### Step 2: Import Enhanced Components

Update your main App.jsx or routing file:

```jsx
import TimetablePageEnhanced from "./components/TimetablePageEnhanced";
import AttendanceTracker from "./components/AttendanceTracker";
import TimetableWidget from "./components/TimetableWidget";
import AttendanceWidget from "./components/AttendanceWidget";
```

#### Step 3: Add Routes (If needed)

If using React Router, add to your routes:

```jsx
import { Routes, Route } from "react-router-dom";

<Routes>
  {/* Existing routes */}
  <Route path="/timetable" element={<TimetablePageEnhanced />} />
  <Route path="/attendance" element={<AttendanceTracker />} />
</Routes>;
```

#### Step 4: Add Dashboard Widgets

In your HomePage.jsx, add the widgets:

```jsx
import TimetableWidget from "./components/TimetableWidget";
import AttendanceWidget from "./components/AttendanceWidget";

export default function HomePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Other components */}

      {/* Add these widgets */}
      <TimetableWidget token={token} currentUser={currentUser} />
      <AttendanceWidget token={token} />
    </div>
  );
}
```

---

## API Endpoints Overview

### Timetable Endpoints

#### Personal Timetable Management

```
GET    /api/timetable/personal
       Get user's personal timetable

PUT    /api/timetable/personal
       Update entire personal timetable

GET    /api/timetable/personal/today
       Get today's schedule

GET    /api/timetable/personal/current-class
       Get current and next class

POST   /api/timetable/personal/class
       Add a new class

PUT    /api/timetable/personal/class/:day/:classId
       Edit a specific class

DELETE /api/timetable/personal/class/:day/:classId
       Delete a class

GET    /api/timetable/personal/free-periods
       Get free periods for the day
```

### Attendance Endpoints

```
GET    /api/timetable/attendance
       Get attendance records

POST   /api/timetable/attendance/subject
       Add subject for tracking

POST   /api/timetable/attendance/mark
       Mark attendance for a class

GET    /api/timetable/attendance/stats
       Get attendance statistics

GET    /api/timetable/attendance/bunk-capacity
       Get bunk analysis

GET    /api/timetable/attendance/calendar/:subjectCode
       Get attendance calendar for subject

DELETE /api/timetable/attendance/subject/:subjectCode
       Remove subject from tracking
```

### Exam Schedule Endpoints

```
POST   /api/timetable/exam-schedule
       Create exam schedule (Admin only)

GET    /api/timetable/exam-schedule
       Get exam schedules
```

### Faculty Endpoints

```
GET    /api/timetable/faculty
       Get faculty information
```

---

## Data Flow Examples

### Example 1: Adding a Class

```javascript
const addClass = async (classData) => {
  const response = await axios.post(
    "/api/timetable/personal/class",
    {
      day: "Monday",
      startTime: "09:00",
      endTime: "10:00",
      subject: "Data Structures",
      subjectCode: "CS201",
      professor: "Dr. Smith",
      professorEmail: "smith@college.edu",
      room: "101",
      building: "Building A",
      type: "LECTURE",
      color: "#3498db",
      customNote: "Bring textbook",
      notificationsEnabled: true,
      notificationTimes: [10, 30],
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data.data;
};
```

### Example 2: Checking Bunk Capacity

```javascript
const checkBunkCapacity = async () => {
  const response = await axios.get(
    "/api/timetable/attendance/bunk-capacity?required=75",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  // Response contains:
  // - subjectCode
  // - subjectName
  // - currentPercentage
  // - canBunk (if safe)
  // - needToAttend (if at risk)
  // - warning (SAFE/CRITICAL)

  return response.data.data;
};
```

### Example 3: Marking Attendance

```javascript
const markAttendance = async (subjectCode, status) => {
  const response = await axios.post(
    "/api/timetable/attendance/mark",
    {
      subjectCode: subjectCode,
      date: new Date().toISOString().split("T")[0],
      timeSlot: "09:00-10:00",
      status: status, // PRESENT, ABSENT, LEAVE
      notes: "Optional notes",
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data.data;
};
```

---

## Component Props

### TimetablePageEnhanced

```jsx
<TimetablePageEnhanced
  isSidebarOpen={boolean}
  currentUser={Object} // { college, branch, semester }
  token={string}
/>
```

### AttendanceTracker

```jsx
<AttendanceTracker token={string} />
```

### TimetableWidget

```jsx
<TimetableWidget
  token={string}
  currentUser={Object} // { college, branch, semester }
/>
```

### AttendanceWidget

```jsx
<AttendanceWidget token={string} />
```

---

## Customization Guide

### Changing Colors

#### Default Class Type Colors

Update in `TimetablePageEnhanced.jsx`:

```javascript
const classTypeColors = {
  LECTURE: "#3498db", // Blue
  LAB: "#2ecc71", // Green
  TUTORIAL: "#e74c3c", // Red
};
```

#### Attendance Status Colors

Update `AttendanceTracker.jsx` or `TimetablePageEnhanced.jsx`:

```javascript
const getAttendanceColor = (percentage) => {
  if (percentage >= 75) return "#2ecc71"; // Green
  if (percentage >= 65) return "#f39c12"; // Yellow
  return "#e74c3c"; // Red
};
```

### Changing Attendance Threshold

Default is 75%. To change:

```javascript
// In any component making bunk calculation request
const required = 70; // Change to your threshold
const res = await axios.get(
  `/api/timetable/attendance/bunk-capacity?required=${required}`,
  { headers: { Authorization: `Bearer ${token}` } },
);
```

### Notification Times

Default notification times: 10 and 30 minutes before class

```javascript
// Update when adding/editing a class
notificationTimes: [5, 15, 30]; // Customize as needed
```

---

## Database Seeding (For Testing)

### Sample Data to Create

```javascript
// Sample College Timetable
const collegeTimetable = {
  college: "AIT Bangalore",
  branch: "CSE",
  semester: "5",
  schedule: [
    {
      day: "Monday",
      classes: [
        {
          timeSlot: "09:00 AM - 10:30 AM",
          subject: "Data Structures",
          subjectCode: "CS201",
          professor: "Dr. Smith",
          room: "201",
          type: "LECTURE",
        },
      ],
    },
  ],
};

// Sample Exam Schedule
const examSchedule = {
  college: "AIT Bangalore",
  branch: "CSE",
  semester: "5",
  examType: "FINAL",
  examPeriod: {
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-05-30"),
  },
  exams: [
    {
      subject: "Data Structures",
      subjectCode: "CS201",
      examDate: new Date("2026-05-15"),
      startTime: "09:00 AM",
      endTime: "12:00 PM",
      location: "Main Campus",
      room: "H-101",
      building: "Academic Block",
      duration: 180,
      totalMarks: 100,
    },
  ],
};

// Sample Faculty
const faculty = {
  name: "Dr. Smith",
  email: "smith@college.edu",
  phone: "+91-8800123456",
  department: "Computer Science",
  college: "AIT Bangalore",
  officeLocation: "Building A, Room 305",
  officeHours: [
    { day: "Monday", startTime: "02:00 PM", endTime: "04:00 PM" },
    { day: "Wednesday", startTime: "02:00 PM", endTime: "04:00 PM" },
  ],
  specialization: ["Data Structures", "Algorithms", "Operating Systems"],
  subjects: ["CS201", "CS202"],
};
```

---

## Troubleshooting

### Issue: Components not loading data

**Solution:**

- Verify token is being passed correctly
- Check browser Network tab for API errors
- Ensure middleware authentication is working

### Issue: Dates showing incorrectly

**Solution:**

- Verify date format (YYYY-MM-DD)
- Check timezone settings
- Ensure Date objects are properly serialized

### Issue: Color coding not showing

**Solution:**

- Verify color hex codes are valid
- Check CSS class names are correct
- Clear browser cache and reload

### Issue: Attendance calculations incorrect

**Solution:**

- Verify total classes are being counted
- Check status values are valid (PRESENT, ABSENT, LEAVE)
- Recalculate using the formula: `(attended / total) * 100`

---

## Performance Tips

1. **Cache timetable data** on initial load
2. **Lazy load** exam schedules only when needed
3. **Debounce** attendance marking operations
4. **Use pagination** if many subjects/classes
5. **Optimize API calls** - fetch only needed data

---

## Security Considerations

1. **Token validation** - Always include auth headers
2. **User isolation** - Only fetch own timetable/attendance
3. **Input validation** - Validate all form inputs
4. **Rate limiting** - Implement on API endpoints
5. **CORS** - Configure proper CORS policies

---

## Browser Compatibility

- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers

---

## File Structure Summary

```
backend/
├── models/Schema.js (Enhanced)
│   ├── PersonalTimetableSchema
│   ├── AttendanceSchema
│   ├── ExamScheduleSchema
│   └── FacultySchema
├── controllers/timetableController.js (Enhanced)
│   ├── Personal timetable functions
│   ├── Attendance functions
│   ├── Exam schedule functions
│   └── Faculty functions
└── routes/timetableRoutes.js (Enhanced)

frontend/src/components/
├── TimetablePageEnhanced.jsx (NEW)
├── AttendanceTracker.jsx (NEW)
├── TimetableWidget.jsx (NEW)
└── AttendanceWidget.jsx (NEW)
```

---

## Next Steps

1. ✅ Backend implementation complete
2. ✅ Frontend components created
3. ⏳ Integrate into your app
4. ⏳ Test with sample data
5. ⏳ Add notifications (optional)
6. ⏳ Deploy to production

---

## Support

For questions or issues:

1. Review the implementation guide
2. Check API documentation
3. Verify data schemas
4. Test with sample data
5. Check browser console for errors

---

**Created**: February 2026
**Last Updated**: February 2026
**Status**: ✅ Ready for Integration
