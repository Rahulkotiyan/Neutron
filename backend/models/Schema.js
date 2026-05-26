const mongoose = require("mongoose");
const Notification = require("./NotificationSchema");

// 1. USER SCHEMA
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  handle: { type: String },
  username: { type: String, unique: true, sparse: true }, // Add username field
  avatar: { type: String },
  department: { type: String },
  year: { type: String },
  college: { type: String, default: "Dr Ambedkar Institute of Technology" },
  branch: { type: String },
  semester: { type: String },
  city: { type: String },
  state: { type: String },
  skills: [{ type: String }],
  bio: { type: String },
  shortBio: { type: String },
  hasProfile: { type: Boolean, default: false }, // Track if profile is completed
  phoneNumber: { type: String },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  banner: { type: String },
  externalLink: { type: String },
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  // Admin privileges
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  suspendedUntil: { type: Date }, // For temporary suspensions

  // E2EE: RSA-OAEP public key stored as JWK JSON string
  // Private key never leaves the user's device (IndexedDB)
  publicKey: { type: String, default: null },
}, { timestamps: true });

// Add index for better query performance
UserSchema.index({ college: 1 });

// 2. POST SCHEMA
const PostSchema = new mongoose.Schema({
  title: { type: String },
  desc: { type: String },
  image: { type: String },
  tag: {
    type: String,
    enum: [
      "ANNOUNCEMENT",
      "MEME",
      "QUESTION",
      "OFFICIAL",
      "CONFESSION",
      "EVENT",
      "GENERAL",
      "NOTICE",
      "ANONYMOUS",
    ],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isAnonymous: { type: Boolean, default: false },
  college: { type: String, default: "Global" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: mongoose.Types.ObjectId },
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true, maxlength: 280 },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      image: { type: String }, // Add image field for comments
      replies: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, default: mongoose.Types.ObjectId },
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          text: { type: String, required: true, maxlength: 280 },
          likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
          parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
          image: { type: String }, // Add image field for replies
        }
      ],
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date },
      reports: [
        {
          reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          reason: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        }
      ],
    },
  ],
  moderation_status: {
    type: String,
    enum: ["APPROVED", "FLAGGED", "REMOVED"],
    default: "APPROVED",
  },
  // New Functional Fields
  scheduledAt: { type: Date },
  views: { type: Number, default: 0 },
  // Notice-specific fields
  eventDate: { type: Date },
  location: { type: String },
  contactPerson: { type: String },
  contactPhone: { type: String },
  contactEmail: { type: String },
  tags: { type: String },
}, { timestamps: true });

// Add index for better query performance
PostSchema.index({ college: 1, tag: 1, createdAt: -1 });

// 2.5. REPORTS SCHEMA
const ReportsSchema = new mongoose.Schema({
  reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  target_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  target_type: {
    type: String,
    enum: ["post", "comment", "profile"],
    required: true,
  },
  reason: {
    type: String,
    enum: [
      "spam",
      "harassment",
      "misinformation",
      "inappropriate",
      "other",
      "hate",
      "abuse_harassment",
      "violent_speech",
      "child_safety",
      "privacy",
      "illegal_behaviors",
      "self_harm",
      "sensitive_media",
      "impersonation",
      "violent_entities",
      "civic_integrity"
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "RESOLVED", "DISMISSED"],
    default: "PENDING",
  },
  created_at: { type: Date, default: Date.now },
});

// Add index for better query performance
ReportsSchema.index({ target_id: 1, status: 1 });
ReportsSchema.index({ reporter_id: 1, target_id: 1 }); // Prevent duplicate reports
ReportsSchema.index({ created_at: -1 });



// 5. LOST & FOUND SCHEMA
const CollegeTimetableSchema = new mongoose.Schema({
  college: { type: String, required: true },
  branch: { type: String, required: true },
  semester: { type: String, required: true },
  schedule: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
      },
      classes: [
        {
          timeSlot: String, // e.g., "9:00 AM - 10:00 AM"
          subject: String,
          subjectCode: String,
          professor: String,
          room: String,
          type: { type: String, enum: ["LECTURE", "LAB", "TUTORIAL"] },
        },
      ],
    },
  ],
}, { timestamps: true });


// Add index for better query performance
CollegeTimetableSchema.index({ college: 1, branch: 1, semester: 1 });

// 8. PERSONAL TIMETABLE SCHEMA
const PersonalTimetableSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  college: { type: String, default: "Dr Ambedkar Institute of Technology" },
  schedule: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
      },
      classes: [
        {
          _id: mongoose.Schema.Types.ObjectId,
          timeSlot: String,
          startTime: String, // HH:MM format
          endTime: String, // HH:MM format
          subject: String,
          subjectCode: String,
          type: { type: String, enum: ["LECTURE", "LAB", "TUTORIAL"] },
          customNote: String,
          color: { type: String, default: "#3498db" }, // Color coding for subjects
          isEdited: { type: Boolean, default: false }, // Track manual edits
          editedAt: Date,
          isOptional: { type: Boolean, default: false },
          notificationsEnabled: { type: Boolean, default: true },
          notificationTimes: [Number], // minutes before class (e.g., [10, 30])
        },
      ],
    },
  ],
  colorScheme: {
    LECTURE: { type: String, default: "#3498db" },
    LAB: { type: String, default: "#2ecc71" },
    TUTORIAL: { type: String, default: "#e74c3c" },
  },
  viewMode: { type: String, enum: ["DAY", "WEEK"], default: "WEEK" },
}, { timestamps: true });

// Add index for better query performance
PersonalTimetableSchema.index({ user: 1 });

// 9. ATTENDANCE SCHEMA
const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  college: { type: String, default: "AIT Bangalore" },
  subjects: [
    {
      subjectCode: String,
      subjectName: String,
      totalClasses: { type: Number, default: 0 },
      classesAttended: { type: Number, default: 0 },
      classesSkipped: { type: Number, default: 0 },
      leaveClasses: { type: Number, default: 0 },
      cancelledClasses: { type: Number, default: 0 },
      attendanceRecords: [
        {
          date: Date,
          timeSlot: String,
          status: {
            type: String,
            enum: ["PRESENT", "ABSENT", "LEAVE", "CANCELLED"],
          },
          notes: String,
          markedAt: { type: Date, default: Date.now },
          markedBy: String, // "AUTO", "MANUAL", "SYSTEM"
        },
      ],
      attendancePercentage: {
        type: Number,
        default: 0,
        get: function () {
          return this.totalClasses > 0
            ? parseFloat(
              ((this.classesAttended / this.totalClasses) * 100).toFixed(2),
            )
            : 0;
        },
      },
      // Bunk calculation fields
      canBunk: { type: Number, default: 0 }, // How many classes can be bunked while maintaining 75%
      needToAttend: { type: Number, default: 0 }, // How many classes needed to reach 75%
      warningStatus: {
        type: String,
        enum: ["SAFE", "WARNING", "CRITICAL"],
        default: "SAFE",
      },
      colorCode: { type: String, default: "#2ecc71" }, // Green, Yellow, Red
      lastUpdated: { type: Date, default: Date.now },
    },
  ],
  attendanceSummary: {
    overallPercentage: { type: Number, default: 0 },
    atRiskSubjects: [String], // Subject codes below 75%
    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
    },
  },
}, { timestamps: true });

// Add index for better query performance
AttendanceSchema.index({ user: 1, createdAt: -1 });

// 10. NOTES LIBRARY SCHEMA
const NotesLibrarySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  semester: { type: String, required: true },
  branch: { type: String },
  documentType: {
    type: String,
    enum: [
      "NOTES",
      "PAST_PAPERS",
      "MODEL_PAPERS",
      "SYLLABUS",
      "MODULES",
      "OTHER",
    ],
    required: true,
  },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number }, // in bytes
  downloads: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  uploader: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    email: String,
    avatar: String,
    college: String,
  },
  college: { type: String, default: "Global" },
  tags: [String],
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0 },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      userAvatar: String,
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  isApproved: { type: Boolean, default: true },
  isGroup: { type: Boolean, default: false },
  files: [
    {
      title: String,
      fileUrl: String,
      fileName: String,
      fileSize: Number,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  visibility: {
    type: String,
    enum: ["PUBLIC", "COLLEGE", "BATCH"],
    default: "PUBLIC",
  },
}, { timestamps: true });

// Add index for better query performance
NotesLibrarySchema.index({ subject: 1, semester: 1, branch: 1 });

// 11. OFFICIAL NOTICES SCHEMA
const NoticesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  noticeType: {
    type: String,
    enum: [
      "NOTICE",
      "ANNOUNCEMENT",
      "POSTER",
      "CIRCULAR",
      "EVENT",
      "FEST",
      "ACADEMIC",
    ],
    required: true,
  },
  category: {
    type: String,
    enum: [
      "GENERAL",
      "ACADEMIC",
      "PLACEMENT",
      "FEST",
      "CLUB",
      "ADMINISTRATION",
      "HOSTEL",
      "OTHERS",
    ],
    required: true,
  },
  priority: {
    type: String,
    enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
    default: "NORMAL",
  },
  imageUrl: { type: String },
  posterUrl: { type: String },
  attachments: [
    {
      name: String,
      url: String,
    },
  ],
  eventDate: { type: Date },
  location: { type: String },
  contactPerson: { type: String },
  contactPhone: { type: String },
  contactEmail: { type: String },
  publisher: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    email: String,
    avatar: String,
    department: String,
    college: String,
  },
  college: { type: String, default: "Global" },
  isOfficial: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
  pinned: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      userAvatar: String,
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  tags: [String],
  status: {
    type: String,
    enum: ["DRAFT", "PUBLISHED", "ARCHIVED", "EXPIRED"],
    default: "PUBLISHED",
  },
  expiryDate: { type: Date },
  visibility: {
    type: String,
    enum: ["PUBLIC", "COLLEGE", "DEPARTMENT", "VERIFIED_USERS"],
    default: "PUBLIC",
  },
}, { timestamps: true });

// 14. CONFESSIONS SCHEMA
const ConfessionsSchema = new mongoose.Schema({
  confession: { type: String, required: true },
  category: {
    type: String,
    enum: [
      "RELATIONSHIP",
      "ACADEMIC",
      "PERSONAL",
      "WORK",
      "FAMILY",
      "HEALTH",
      "FINANCIAL",
      "OTHER",
    ],
    default: "PERSONAL",
  },
  tags: [{ type: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  confessionHash: { type: String }, // Hash to allow deletion without revealing identity
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      text: { type: String, required: true },
      userHash: String, // Hash to identify commenter without revealing identity
      createdAt: { type: Date, default: Date.now },
    },
  ],
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  views: { type: Number, default: 0 },
}, { timestamps: true });

// Add index for better query performance
ConfessionsSchema.index({ category: 1, createdAt: -1 });

// 15. STUDENT EXAM SCHEMA
const StudentExamSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  subjectCode: { type: String, required: true },
  examDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  room: { type: String },
  building: { type: String },
  totalMarks: { type: Number },
  instructions: { type: String },
  notificationsEnabled: { type: Boolean, default: false },
  notificationTimes: [{ type: String }], // Array of notification times before exam
  type: {
    type: String,
    enum: ["INTERNAL", "EXTERNAL", "PRACTICAL", "THEORY", "ASSIGNMENT", "TASK"],
    default: "EXTERNAL",
  },
  status: {
    type: String,
    enum: ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"],
    default: "UPCOMING",
  },
}, { timestamps: true });

// Add index for better query performance
StudentExamSchema.index({ user: 1, examDate: 1 });

module.exports = {
  User: mongoose.model("User", UserSchema),
  Post: mongoose.model("Post", PostSchema),
  Report: mongoose.model("Report", ReportsSchema),
  CollegeTimetable: mongoose.model("CollegeTimetable", CollegeTimetableSchema),
  PersonalTimetable: mongoose.model(
    "PersonalTimetable",
    PersonalTimetableSchema,
  ),
  Attendance: mongoose.model("Attendance", AttendanceSchema),
  NotesLibrary: mongoose.model("NotesLibrary", NotesLibrarySchema),
  Notices: mongoose.model("Notices", NoticesSchema),
  Confessions: mongoose.model("Confessions", ConfessionsSchema),
  StudentExam: mongoose.model("StudentExam", StudentExamSchema),
  Notification: Notification,
};
