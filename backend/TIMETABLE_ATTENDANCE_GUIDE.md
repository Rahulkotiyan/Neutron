# Attendance and Timetable System - Implementation Guide

## Overview

This document provides a comprehensive guide to the newly implemented Attendance and Timetable system with advanced features for student management.

---

## Features Implemented

### 1. **Timetable Management** ✅

#### Core Features:

- **Dynamic Schedule View**: Week and day views (extensible to month view)
- **Current Class Indicator**: Shows currently happening and next class
- **Subject Details**: Complete class information (room, faculty, time)
- **Personal Timetable**: Users can add, edit, and delete classes

#### Advanced Features:

- **Color Coding**: Assign colors to different subjects/class types
  - Lectures: Blue (#3498db)
  - Labs: Green (#2ecc71)
  - Tutorials: Red (#e74c3c)
  - Custom colors supported

- **Free Period Detection**: Automatically detects and displays free periods
- **Edit Tracking**: System marks manually edited classes
- **Notifications**: Setup class reminders (10, 30 minutes before)
- **Faculty Connect**: Professor email and office info support

#### Endpoints:

```
GET  /api/timetable/personal                    - Get personal timetable
POST /api/timetable/personal/class              - Add a class
PUT  /api/timetable/personal/class/:day/:classId - Edit class
DELETE /api/timetable/personal/class/:day/:classId - Delete class
GET  /api/timetable/personal/today              - Get today's schedule
GET  /api/timetable/personal/current-class      - Get current & next class
GET  /api/timetable/personal/free-periods       - Get free periods
```

---

### 2. **Attendance Tracking** ✅

#### Core Features:

- **Subject-wise Tracking**: Attendance percentage per subject
- **Visual Progress Bars**: Color-coded (Green/Yellow/Red) based on thresholds
- **Attendance Records**: Track Present/Absent/Leave/Cancelled status
- **Calendar View**: Visual attendance history per subject

#### Advanced Features:

- **Bunk Calculator**: "Can I Bunk?" feature showing safe bunks remaining
- **Makeup Calculator**: Shows classes needed to reach 75% attendance
- **Risk Levels**: SAFE, WARNING, CRITICAL status
- **Summary Statistics**: Overall attendance and at-risk subjects

#### Logic:

```
Safe Bunks Calculation:
If current attendance >= 75%:
  canBunk = floor((attended - 0.75 * total) / 0.25)

Need to Attend Calculation:
If current attendance < 75%:
  needAttend = ceil(0.75 * (total + 10) - attended)

Overall Percentage:
  percentage = (attended / total) * 100
```

#### Endpoints:

```
GET  /api/timetable/attendance                  - Get attendance
POST /api/timetable/attendance/subject          - Add subject
POST /api/timetable/attendance/mark             - Mark attendance
GET  /api/timetable/attendance/stats            - Get statistics
DELETE /api/timetable/attendance/subject/:code  - Delete subject
GET  /api/timetable/attendance/bunk-capacity    - Bunk analysis
GET  /api/timetable/attendance/calendar/:code   - Calendar view
```

---

### 3. **Exam Schedule Integration** ✅

#### Features:

- **Exam Schedule Management**: Create and fetch exam schedules
- **Exam Types**: MIDTERM, FINAL, QUIZ, PRACTICAL, VIVA, INTERNAL
- **Detailed Information**:
  - Exam date, time, duration
  - Location, room, building
  - Seating arrangement
  - Syllabus and instructions

#### Endpoints:

```
POST /api/timetable/exam-schedule               - Create exam schedule (Admin)
GET  /api/timetable/exam-schedule               - Get exam schedules
```

---

### 4. **Faculty Connect** ✅

#### Features:

- **Faculty Information**: Search and view professor details
- **Office Hours**: View availability
- **Contact Information**: Email, phone, location
- **Subjects**: View subjects taught

#### Endpoints:

```
GET  /api/timetable/faculty                     - Get faculty info
```

---

## Frontend Components

### 1. **TimetablePageEnhanced.jsx**

Complete timetable management interface with:

- Three-tab layout (Timetable, Attendance, Exams)
- Current class highlight
- Free periods display
- Add/Edit/Delete class functionality
- Bunk calculator display
- Exam schedule viewing
- Real-time schedule updates

### 2. **AttendanceTracker.jsx**

Dedicated attendance tracking component with:

- Summary statistics cards
- Bunk manager with visual indicators
- Subject-wise attendance breakdown
- Attendance calendar with date-based records
- Risk level warnings

### 3. **TimetableWidget.jsx**

Dashboard widget showing:

- Today's schedule preview
- Current class highlight
- Next 4 classes
- Quick link to full timetable
- Auto-refresh every 60 seconds

### 4. **AttendanceWidget.jsx**

Dashboard widget showing:

- Overall attendance percentage
- At-risk subjects count
- Top 3 subjects status
- Quick link to attendance page

---

## Database Schemas

### PersonalTimetable Schema

```javascript
{
  user: ObjectId,
  college: String,
  schedule: [
    {
      day: String,
      classes: [
        {
          _id: ObjectId,
          timeSlot: String,
          startTime: String, // HH:MM
          endTime: String,   // HH:MM
          subject: String,
          subjectCode: String,
          professor: String,
          professorEmail: String,
          room: String,
          building: String,
          type: String, // LECTURE, LAB, TUTORIAL
          customNote: String,
          color: String,
          isEdited: Boolean,
          editedAt: Date,
          notificationsEnabled: Boolean,
          notificationTimes: [Number]
        }
      ]
    }
  ],
  colorScheme: {
    LECTURE: String,
    LAB: String,
    TUTORIAL: String
  },
  viewMode: String, // DAY, WEEK
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance Schema

```javascript
{
  user: ObjectId,
  college: String,
  subjects: [
    {
      subjectCode: String,
      subjectName: String,
      totalClasses: Number,
      classesAttended: Number,
      classesSkipped: Number,
      leaveClasses: Number,
      cancelledClasses: Number,
      attendanceRecords: [
        {
          date: Date,
          timeSlot: String,
          status: String, // PRESENT, ABSENT, LEAVE, CANCELLED
          notes: String,
          markedAt: Date,
          markedBy: String // AUTO, MANUAL, SYSTEM
        }
      ],
      attendancePercentage: Number,
      canBunk: Number,
      needToAttend: Number,
      warningStatus: String, // SAFE, WARNING, CRITICAL
      colorCode: String,
      lastUpdated: Date
    }
  ],
  attendanceSummary: {
    overallPercentage: Number,
    atRiskSubjects: [String],
    riskLevel: String // LOW, MEDIUM, HIGH
  },
  createdAt: Date,
  updatedAt: Date
}
```

### ExamSchedule Schema

```javascript
{
  college: String,
  branch: String,
  semester: String,
  examType: String, // MIDTERM, FINAL, etc.
  examPeriod: {
    startDate: Date,
    endDate: Date
  },
  exams: [
    {
      subject: String,
      subjectCode: String,
      examDate: Date,
      startTime: String,
      endTime: String,
      location: String,
      room: String,
      building: String,
      duration: Number,
      totalMarks: Number,
      instructions: String,
      syllabus: String,
      seatingArrangement: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Faculty Schema

```javascript
{
  name: String,
  email: String,
  phone: String,
  department: String,
  college: String,
  officeLocation: String,
  officeHours: [
    {
      day: String,
      startTime: String,
      endTime: String
    }
  ],
  specialization: [String],
  avatar: String,
  subjects: [String],
  bio: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Usage Guide

### For Students

#### Adding a Class:

1. Navigate to Timetable tab
2. Click "Add Class" button
3. Fill in details (day, time, subject, professor, room)
4. Choose class type and color
5. Enable notifications if needed
6. Save

#### Viewing Attendance:

1. Navigate to Attendance tab
2. View bunk manager with safe bunk recommendations
3. Click on a subject to see attendance calendar
4. Check overall statistics

#### Checking Schedule:

1. View "Current Class" highlight on timetable
2. See free periods for the day
3. Click on any day to expand schedule
4. Use dashboard widgets for quick overview

### For Admins/Faculty

#### Creating Exam Schedule:

1. Make POST request to `/api/timetable/exam-schedule`
2. Provide college, branch, semester, exam details
3. Add individual exam information
4. Students can view through exam tab

#### Adding Faculty Info:

1. Create faculty records with contact details
2. Add office hours and specializations
3. Link to subjects
4. Students can search and connect

---

## Integration with Dashboard

### Add Widgets to HomePage:

```jsx
import TimetableWidget from "./TimetableWidget";
import AttendanceWidget from "./AttendanceWidget";

export default function HomePage() {
  return (
    <div>
      {/* Other components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TimetableWidget token={token} currentUser={currentUser} />
        <AttendanceWidget token={token} />
      </div>
    </div>
  );
}
```

---

## Notification System Setup

To enable class notifications (future enhancement):

```javascript
// Schedule notification 10 minutes before class
export const scheduleClassNotification = (classData) => {
  const notificationTime = new Date(classData.startTime);
  notificationTime.setMinutes(notificationTime.getMinutes() - 10);

  // Browser notification
  new Notification(`Upcoming: ${classData.subject}`, {
    body: `In ${classData.room} at ${classData.startTime}`,
    icon: "/classroom-icon.png",
  });
};
```

---

## Color Coding System

### Default Colors:

- **Lectures**: #3498db (Blue)
- **Labs**: #2ecc71 (Green)
- **Tutorials**: #e74c3c (Red)
- **Custom**: User selectable

### Attendance Status Colors:

- **Green (#2ecc71)**: ≥ 75% (SAFE)
- **Yellow (#f39c12)**: 65-74% (WARNING)
- **Red (#e74c3c)**: < 65% (CRITICAL)

---

## Performance Optimizations

1. **Caching**: Timetable data cached on client
2. **Lazy Loading**: Calendar views load data on demand
3. **Auto-refresh**: Dashboard widgets refresh every 60 seconds
4. **Debouncing**: Edit operations debounced
5. **Query Optimization**: Indexed searches on subject codes and colleges

---

## Future Enhancements

1. **Real-time Notifications**: Push notifications for class reminders
2. **Calendar Export**: Export timetable to iCal/Google Calendar
3. **Attendance QR**: QR-based attendance marking
4. **Mobile App**: Dedicated mobile application
5. **Analytics Dashboard**: Detailed attendance analytics
6. **AI Predictions**: Predict attendance trends
7. **Integration with LMS**: Connect with learning management systems
8. **Voice Reminders**: Audio notifications for classes

---

## API Testing

### Sample cURL Requests:

**Get Today's Schedule:**

```bash
curl -X GET http://localhost:5000/api/timetable/personal/today \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Add a Class:**

```bash
curl -X POST http://localhost:5000/api/timetable/personal/class \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "day": "Monday",
    "startTime": "09:00",
    "endTime": "10:30",
    "subject": "Data Structures",
    "subjectCode": "CS201",
    "professor": "Dr. Smith",
    "room": "101",
    "type": "LECTURE",
    "color": "#3498db"
  }'
```

**Get Bunk Analysis:**

```bash
curl -X GET "http://localhost:5000/api/timetable/attendance/bunk-capacity?required=75" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Handling

Common error responses:

**400 Bad Request**: Missing required fields

```json
{
  "success": false,
  "message": "Day, start time, end time, and subject are required"
}
```

**404 Not Found**: Resource doesn't exist

```json
{
  "success": false,
  "message": "Class not found"
}
```

**500 Server Error**: Internal server error

```json
{
  "success": false,
  "message": "Error adding personal class",
  "error": "error details"
}
```

---

## Support & Maintenance

For issues or questions:

1. Check endpoint documentation
2. Review schema structures
3. Verify authentication tokens
4. Check browser console for errors
5. Review backend logs for server errors

---

_Last Updated: February 2026_
_Version: 1.0.0_
