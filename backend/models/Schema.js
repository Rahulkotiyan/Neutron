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

//Group schema
const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
  banner: { type: String },
  type: {
    type: String,
    enum: ["DEPT", "CLUB", "COLLEGE", "STUDY", "PROJECT", "SOCIAL"],
    default: "CLUB",
  },
  description: { type: String },
  college: { type: String, default: "Global" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // Join policy: who can join and how
  joinPolicy: {
    type: String,
    enum: ["PUBLIC", "INVITE_ONLY", "APPROVAL_REQUIRED"],
    default: "PUBLIC",
  },
  // Pending join requests when joinPolicy === "APPROVAL_REQUIRED"
  joinRequests: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      message: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  // E2EE: members now carry their encrypted copy of the AES group key
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      roleId: { type: mongoose.Schema.Types.ObjectId, default: null },
      // AES-GCM group key, RSA-OAEP wrapped with this member's public key (base64)
      encryptedGroupKey: { type: String, default: null },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  bannedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // Whether this group uses E2EE (set true on creation via the new flow)
  isEncrypted: { type: Boolean, default: false },

  // Discord-like channels
  channels: [
    {
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ["TEXT", "VOICE", "ANNOUNCEMENT", "STAGE"],
        default: "TEXT",
      },
      description: { type: String },
      categoryId: { type: mongoose.Schema.Types.ObjectId },
      position: { type: Number, default: 0 },
      nsfw: { type: Boolean, default: false },
      slowMode: { type: Number, default: 0 }, // in seconds
      userLimit: { type: Number, default: 0 }, // for voice channels
      bitrate: { type: Number, default: 64000 }, // for voice channels
      messagePermissions: {
        type: String,
        enum: ["everyone", "admin"],
        default: "everyone",
      },
      permissions: [
        {
          role: { type: String }, // "everyone", "admin", "moderator", "member"
          allow: [{ type: String }], // permissions to allow
          deny: [{ type: String }], // permissions to deny
        },
      ],
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],

  // Channel categories
  categories: [
    {
      name: { type: String, required: true },
      position: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  // Roles and permissions
  roles: [
    {
      name: { type: String, required: true },
      color: { type: String, default: "#99AAB5" },
      position: { type: Number, default: 0 },
      permissions: [{ type: String }],
      mentionable: { type: Boolean, default: false },
      hoist: { type: Boolean, default: false }, // show separately in member list
      createdAt: { type: Date, default: Date.now },
    },
  ],

  // Member roles mapping
  memberRoles: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      roleIds: [{ type: mongoose.Schema.Types.ObjectId }],
      joinedAt: { type: Date, default: Date.now },
    },
  ],

  // Server settings
  settings: { },

  // Stats and activity
  stats: {
    messageCount: { type: Number, default: 0 },
    memberCount: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
  },
}, { timestamps: true });

// Add index for better query performance
GroupSchema.index({ college: 1, createdAt: -1 });

// 4. MESSAGE SCHEMA (Enhanced Discord-like Features)
const MessageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, required: true }, // specific channel
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Plain content kept for system messages and backward compat.
  // Encrypted messages use ciphertext + iv instead.
  content: { type: String, default: "" },
  // E2EE fields: AES-GCM encrypted payload
  ciphertext: { type: String, default: null }, // base64 encoded encrypted message
  iv: { type: String, default: null },         // base64 encoded initialization vector
  type: {
    type: String,
    enum: ["DEFAULT", "SYSTEM", "WELCOME", "BOOST", "CHANNEL_FOLLOW_ADD", "ENCRYPTED", "POLL"],
    default: "DEFAULT",
  },

  // Native polling for class decisions
  poll: {
    question: { type: String },
    multiple: { type: Boolean, default: false },
    closesAt: { type: Date },
    options: [
      {
        id: { type: String, required: true }, // stable option id for votes
        label: { type: String, required: true },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
  },

  // Rich content
  embeds: [
    {
      title: { type: String },
      description: { type: String },
      url: { type: String },
      color: { type: Number }, // color code
      timestamp: { type: Date },
      footer: {
        text: { type: String },
        iconUrl: { type: String },
      },
      image: {
        url: { type: String },
        proxyUrl: { type: String },
        width: { type: Number },
        height: { type: Number },
      },
      thumbnail: {
        url: { type: String },
        proxyUrl: { type: String },
        width: { type: Number },
        height: { type: Number },
      },
      video: {
        url: { type: String },
        proxyUrl: { type: String },
        width: { type: Number },
        height: { type: Number },
      },
      author: {
        name: { type: String },
        url: { type: String },
        iconUrl: { type: String },
        proxyIconUrl: { type: String },
      },
      fields: [
        {
          name: { type: String, required: true },
          value: { type: String, required: true },
          inline: { type: Boolean, default: false },
        },
      ],
    },
  ],

  // Attachments
  attachments: [
    {
      id: { type: String, required: true },
      filename: { type: String, required: true },
      description: { type: String },
      contentType: { type: String },
      size: { type: Number },
      url: { type: String },
      proxyUrl: { type: String },
      height: { type: Number },
      width: { type: Number },
      ephemeral: { type: Boolean, default: false },
    },
  ],

  // Reactions
  reactions: [
    {
      emoji: { type: String, required: true },
      emojiId: { type: String }, // for custom emojis
      count: { type: Number, default: 0 },
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      me: { type: Boolean, default: false },
    },
  ],

  // Mentions
  mentions: {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    roles: [{ type: mongoose.Schema.Types.ObjectId }],
    channels: [{ type: mongoose.Schema.Types.ObjectId }],
    everyone: { type: Boolean, default: false },
    repliedUser: { type: Boolean, default: false },
  },

  // Thread support
  thread: {
    id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    autoArchiveDuration: { type: Number, default: 1440 }, // in minutes
    locked: { type: Boolean, default: false },
    invitable: { type: Boolean, default: true },
    rateLimitPerUser: { type: Number, default: 0 },
    flags: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    memberCount: { type: Number, default: 0 },
    appliedTags: [{ type: String }],
  },

  // Reply/Reference
  reference: {
    messageId: { type: mongoose.Schema.Types.ObjectId },
    channelId: { type: mongoose.Schema.Types.ObjectId },
    guildId: { type: mongoose.Schema.Types.ObjectId },
    failIfNotExists: { type: Boolean, default: true },
  },

  // Components (buttons, select menus, etc.)
  components: [
    {
      type: { type: String, enum: ["ACTION_ROW", "BUTTON", "SELECT_MENU"] },
      components: [
        {
          type: { type: String },
          style: { type: Number },
          label: { type: String },
          emoji: { type: String },
          customId: { type: String },
          url: { type: String },
          disabled: { type: Boolean, default: false },
          placeholder: { type: String },
          minValues: { type: Number, default: 1 },
          maxValues: { type: Number, default: 1 },
          options: [
            {
              label: { type: String, required: true },
              value: { type: String, required: true },
              description: { type: String },
              emoji: { type: String },
              default: { type: Boolean, default: false },
            },
          ],
        },
      ],
    },
  ],

  // Stickers
  stickerItems: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      format: { type: Number },
      description: { type: String },
    },
  ],

  // Message flags
  flags: { type: Number, default: 0 },

  // Interaction metadata
  interaction: {
    id: { type: String },
    type: { type: Number },
    name: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    member: {
      roles: [{ type: String }],
      permissions: { type: String },
      joinedAt: { type: Date },
    },
  },

  // Webhook data
  webhook: {
    id: { type: String },
    type: { type: Number },
    name: { type: String },
    avatar: { type: String },
    applicationId: { type: String },
  },

  editedTimestamp: { type: Date },
  edited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  deletedTimestamp: { type: Date },

  // Message statistics
  stats: {
    viewCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    reactionCount: { type: Number, default: 0 },
  },

  // Pinned status
  pinned: { type: Boolean, default: false },
  pinnedAt: { type: Date },
  pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// Add index for better query performance
MessageSchema.index({ group: 1, channel: 1, createdAt: -1 });



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
  Group: mongoose.model("Group", GroupSchema),
  Message: mongoose.model("Message", MessageSchema),
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
