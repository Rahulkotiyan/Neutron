const mongoose = require("mongoose");

// 1. USER SCHEMA
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  handle: { type: String },
  avatar: { type: String },
  department: { type: String },
  year: { type: String },
  college: { type: String, default: "AIT Bangalore" },
  branch: { type: String },
  semester: { type: String },
  city: { type: String },
  state: { type: String },
  skills: [{ type: String }],
  bio: { type: String },
  phoneNumber: { type: String },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

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
      "LOST_FOUND",
      "OFFICIAL",
      "CONFESSION",
      "EVENT",
      "GENERAL",
    ],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isAnonymous: { type: Boolean, default: false },
  stats: { type: String, default: "0" },
  createdAt: { type: Date, default: Date.now },
  college: { type: String, default: "Global" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

// 3. GROUP SCHEMA (For Discord Page)
const GroupSchema = new mongoose.Schema({
  name: String,
  icon: String,
  type: { type: String, enum: ["DEPT", "CLUB", "COLLEGE"] },
  description: String,
  college: { type: String, default: "Global" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

// 4. MESSAGE SCHEMA (For Group Messaging)
const MessageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  edited: { type: Boolean, default: false },
  editedAt: Date,
});

// 4. MARKETPLACE LISTING (For Market Page)
const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: {
    type: String,
    enum: ["BOOKS", "LAPTOPS", "PHONES", "ACCESSORIES", "OTHER"],
    required: true,
  },
  condition: {
    type: String,
    enum: ["LIKE_NEW", "GOOD", "FAIR"],
    default: "GOOD",
  },
  image: { type: String },
  seller: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    email: String,
    phoneNumber: String,
    avatar: String,
    college: String,
  },
  status: {
    type: String,
    enum: ["AVAILABLE", "SOLD"],
    default: "AVAILABLE",
  },
  views: { type: Number, default: 0 },
  college: { type: String, default: "Global" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 5. LOST & FOUND SCHEMA
const LostFoundSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ["LOST", "FOUND"],
    required: true,
  },
  category: {
    type: String,
    enum: [
      "DOCUMENTS",
      "ELECTRONICS",
      "ACCESSORIES",
      "KEYS",
      "CLOTHING",
      "OTHER",
    ],
    required: true,
  },
  image: { type: String },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  itemName: { type: String },
  color: { type: String },
  distinguishingMarks: { type: String },
  poster: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    email: String,
    phoneNumber: String,
    avatar: String,
    college: String,
  },
  status: {
    type: String,
    enum: ["ACTIVE", "RESOLVED"],
    default: "ACTIVE",
  },
  responses: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      message: String,
      phoneNumber: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  college: { type: String, default: "Global" },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 5. EVENT SCHEMA (For Right Sidebar)
const EventSchema = new mongoose.Schema({
  title: String,
  date: String,
  time: String,
  location: String,
  color: String,
});

// 6. RESOURCE SCHEMA
const ResourceSchema = new mongoose.Schema({
  title: String,
  subject: String,
  link: String,
  type: { type: String, enum: ["PDF", "LINK"] },
});

// 7. COLLEGE TIMETABLE SCHEMA
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 8. PERSONAL TIMETABLE SCHEMA
const PersonalTimetableSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  college: { type: String, default: "AIT Bangalore" },
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
          timeSlot: String,
          subject: String,
          subjectCode: String,
          professor: String,
          room: String,
          type: { type: String, enum: ["LECTURE", "LAB", "TUTORIAL"] },
          customNote: String,
        },
      ],
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

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
      attendanceRecords: [
        {
          date: Date,
          timeSlot: String,
          status: { type: String, enum: ["PRESENT", "ABSENT", "LEAVE"] },
          notes: String,
        },
      ],
      attendancePercentage: {
        type: Number,
        default: 0,
        get: function () {
          return this.totalClasses > 0
            ? parseFloat(
                ((this.classesAttended / this.totalClasses) * 100).toFixed(2)
              )
            : 0;
        },
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

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
  visibility: {
    type: String,
    enum: ["PUBLIC", "COLLEGE", "BATCH"],
    default: "PUBLIC",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

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
  isResolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = {
  User: mongoose.model("User", UserSchema),
  Post: mongoose.model("Post", PostSchema),
  Group: mongoose.model("Group", GroupSchema),
  Message: mongoose.model("Message", MessageSchema),
  Listing: mongoose.model("Listing", ListingSchema),
  LostFound: mongoose.model("LostFound", LostFoundSchema),
  Event: mongoose.model("Event", EventSchema),
  Resource: mongoose.model("Resource", ResourceSchema),

  CollegeTimetable: mongoose.model("CollegeTimetable", CollegeTimetableSchema),
  PersonalTimetable: mongoose.model(
    "PersonalTimetable",
    PersonalTimetableSchema
  ),
  Attendance: mongoose.model("Attendance", AttendanceSchema),
  NotesLibrary: mongoose.model("NotesLibrary", NotesLibrarySchema),
  Notices: mongoose.model("Notices", NoticesSchema),
  Confessions: mongoose.model("Confessions", ConfessionsSchema),
};
