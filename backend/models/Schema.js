const mongoose = require("mongoose");
const NotificationSchema = require("./NotificationSchema");

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

  // Premium user features
  isPremium: { type: Boolean, default: false },
  premiumPlan: {
    type: String,
    enum: ["BASIC", "PREMIUM", "ULTIMATE"],
  },
  premiumFeatures: {
    animatedAvatar: { type: Boolean, default: false },
    customBanner: { type: Boolean, default: false },
    profileThemes: { type: Boolean, default: false },
    customEmojis: { type: Boolean, default: false },
    largerUploads: { type: Boolean, default: false },
    hdStreaming: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    boostsAvailable: { type: Number, default: 0 },
    customProfileUrl: { type: Boolean, default: false },
    earlyAccess: { type: Boolean, default: false },
  },
  boostsAvailable: { type: Number, default: 0 },
  boostsUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
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
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  moderation_status: {
    type: String,
    enum: ["APPROVED", "FLAGGED", "REMOVED"],
    default: "APPROVED",
  },
});

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
    enum: ["spam", "harassment", "misinformation", "inappropriate", "other"],
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
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bannedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

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

  // Voice sessions
  voiceSessions: [
    {
      channelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      participants: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          joinedAt: { type: Date, default: Date.now },
          muted: { type: Boolean, default: false },
          deafened: { type: Boolean, default: false },
          speaking: { type: Boolean, default: false },
        },
      ],
      createdAt: { type: Date, default: Date.now },
    },
  ],

  // Server settings
  settings: {
    verificationLevel: {
      type: String,
      enum: ["NONE", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
      default: "NONE",
    },
    explicitContentFilter: {
      type: String,
      enum: ["DISABLED", "MEMBERS_WITHOUT_ROLES", "ALL_MEMBERS"],
      default: "DISABLED",
    },
    defaultMessageNotifications: {
      type: String,
      enum: ["ALL_MESSAGES", "ONLY_MENTIONS"],
      default: "ALL_MESSAGES",
    },
    systemChannelFlags: [{ type: String }],
    preferredLocale: { type: String, default: "en-US" },
    afkChannelId: { type: mongoose.Schema.Types.ObjectId },
    afkTimeout: { type: Number, default: 300 }, // in seconds
    // Premium features
    boostLevel: { type: Number, default: 0 },
    boostCount: { type: Number, default: 0 },
    premiumFeatures: {
      customEmojiPack: { type: Boolean, default: false },
      customWallpaper: { type: Boolean, default: false },
      voiceToText: { type: Boolean, default: false },
      unlimitedStories: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      automationRules: { type: Boolean, default: false },
      customThemes: { type: Boolean, default: false },
      largerUploads: { type: Boolean, default: false },
      hdStreaming: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
    },
    boostFeatures: {
      storiesPerDay: { type: Number, default: 0 },
      coverColors: { type: Number, default: 1 },
      hasEmojiPack: { type: Boolean, default: false },
      hasCustomLogo: { type: Boolean, default: false },
      hasVoiceToText: { type: Boolean, default: false },
      emojiStatuses: { type: Number, default: 0 },
      customBackgrounds: { type: Number, default: 0 },
    },
  },

  // Stats and activity
  stats: {
    messageCount: { type: Number, default: 0 },
    memberCount: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
  },

  // Welcome system
  welcomeSystem: {
    enabled: { type: Boolean, default: false },
    message: { type: String },
    channelId: { type: mongoose.Schema.Types.ObjectId },
    autoRole: { type: mongoose.Schema.Types.ObjectId },
  },

  // Custom emojis
  emojis: [
    {
      name: { type: String, required: true },
      url: { type: String, required: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 4. MESSAGE SCHEMA (Enhanced Discord-like Features)
const MessageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, required: true }, // specific channel
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ["DEFAULT", "SYSTEM", "WELCOME", "BOOST", "CHANNEL_FOLLOW_ADD"],
    default: "DEFAULT",
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

  timestamp: { type: Date, default: Date.now },
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
});

// 4. MARKETPLACE LISTING (Enhanced OLX-like Features)
const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 }, // For showing discount
  negotiable: { type: Boolean, default: true },
  category: {
    type: String,
    enum: [
      "ELECTRONICS",
      "MOBILES",
      "VEHICLES",
      "BICYCLES",
      "BOOKS",
      "FURNITURE",
      "FASHION",
      "PETS",
      "SPORTS",
      "SERVICES",
      "JOBS",
      "REAL_ESTATE",
      "ACCOMMODATION",
      "OTHER",
    ],
    required: true,
  },
  subcategory: { type: String }, // More specific category
  brand: { type: String },
  model: { type: String },
  year: { type: Number }, // For vehicles, electronics
  condition: {
    type: String,
    enum: ["NEW", "LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"],
    default: "GOOD",
  },
  usage: { type: String }, // e.g., "Lightly used", "Heavy usage"
  images: [{ type: String }], // Multiple images support
  thumbnail: { type: String }, // Main thumbnail image
  videoUrl: { type: String }, // Video support
  seller: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    email: String,
    phoneNumber: String,
    avatar: String,
    college: String,
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalSales: { type: Number, default: 0 },
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
    address: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
  },
  status: {
    type: String,
    enum: ["AVAILABLE", "RESERVED", "SOLD", "EXPIRED", "REMOVED"],
    default: "AVAILABLE",
  },
  featured: { type: Boolean, default: false }, // Featured listings
  urgent: { type: Boolean, default: false }, // Urgent sale
  deliveryAvailable: { type: Boolean, default: false },
  shippingAvailable: { type: Boolean, default: false },
  warranty: { type: String }, // Warranty information
  returnPolicy: { type: String },
  specifications: { type: mongoose.Schema.Types.Mixed }, // Flexible specifications object
  tags: [{ type: String }], // Searchable tags
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Wishlist/favorites
  reports: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String, required: true },
      description: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  college: { type: String, default: "Global" },
  boostLevel: { type: Number, default: 0 }, // For promoted listings
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }, // 30 days
  lastBumpedAt: { type: Date, default: Date.now }, // For bumping listings
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for better search performance
ListingSchema.index({ title: "text", description: "text", tags: "text" });
ListingSchema.index({ category: 1, subcategory: 1 });
ListingSchema.index({ status: 1, featured: 1 });
ListingSchema.index({ "location.coordinates": "2dsphere" });
ListingSchema.index({ price: 1 });
ListingSchema.index({ createdAt: -1 });
ListingSchema.index({ college: 1 });

// MARKETPLACE CONVERSATION SCHEMA
const MarketplaceConversationSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: { type: String, enum: ["BUYER", "SELLER"], required: true },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  messages: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      content: { type: String, required: true },
      type: {
        type: String,
        enum: ["TEXT", "IMAGE", "OFFER", "LOCATION", "CONTACT"],
        default: "TEXT",
      },
      attachmentUrl: String,
      offerAmount: Number,
      isRead: { type: Boolean, default: false },
      readAt: { type: Date },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  lastMessage: {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    createdAt: { type: Date, default: Date.now },
  },
  status: {
    type: String,
    enum: ["ACTIVE", "COMPLETED", "CANCELLED"],
    default: "ACTIVE",
  },
  dealStatus: {
    type: String,
    enum: [
      "NEGOTIATING",
      "AGREED",
      "PAID",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
    default: "NEGOTIATING",
  },
  finalPrice: Number,
  meetingLocation: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// MARKETPLACE REVIEW SCHEMA
const MarketplaceReviewSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  comment: { type: String, required: true },
  transactionType: {
    type: String,
    enum: ["BUYER", "SELLER"],
    required: true,
  },
  helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  response: {
    text: String,
    respondedAt: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
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
          _id: mongoose.Schema.Types.ObjectId,
          timeSlot: String,
          startTime: String, // HH:MM format
          endTime: String, // HH:MM format
          subject: String,
          subjectCode: String,
          professor: String,
          professorEmail: String,
          room: String,
          building: String,
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

// 12. PREMIUM SUBSCRIPTION SCHEMA
const PremiumSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: {
    type: String,
    enum: ["BASIC", "PREMIUM", "ULTIMATE"],
    required: true,
  },
  status: {
    type: String,
    enum: ["ACTIVE", "CANCELLED", "EXPIRED", "TRIAL"],
    default: "ACTIVE",
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  autoRenew: { type: Boolean, default: true },
  paymentMethod: {
    type: String,
    enum: ["CARD", "PAYPAL", "CRYPTO", "BANK_TRANSFER"],
  },
  monthlyPrice: { type: Number, required: true },
  yearlyPrice: { type: Number },
  features: [{ type: String }],
  boostsAvailable: { type: Number, default: 0 },
  boostsUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 13. GROUP BOOST SCHEMA
const GroupBoostSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  boostedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  boostLevel: { type: Number, default: 1, min: 1, max: 10 },
  features: [{ type: String }],
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  boostType: {
    type: String,
    enum: ["PREMIUM_USER", "ADMIN_GIFT", "PURCHASED"],
    default: "PREMIUM_USER",
  },
  createdAt: { type: Date, default: Date.now },
});

// 14. CUSTOM EMOJI PACK SCHEMA
const CustomEmojiPackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  emojis: [
    {
      name: { type: String, required: true },
      url: { type: String, required: true },
      animated: { type: Boolean, default: false },
      keywords: [String],
    },
  ],
  isPublic: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  requiredBoostLevel: { type: Number, default: 4 },
  downloads: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

// 15. GROUP ANALYTICS SCHEMA
const GroupAnalyticsSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  date: { type: Date, required: true },
  metrics: {
    activeMembers: { type: Number, default: 0 },
    newMembers: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    topChannels: [
      {
        channelId: { type: mongoose.Schema.Types.ObjectId },
        name: String,
        messageCount: Number,
      },
    ],
    peakActivityHours: [Number],
    memberGrowth: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 },
  },
  demographics: {
    ageGroups: [
      {
        range: String,
        count: Number,
      },
    ],
    departments: [
      {
        name: String,
        count: Number,
      },
    ],
    years: [
      {
        year: String,
        count: Number,
      },
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

// 16. GROUP STORY SCHEMA
const GroupStorySchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: {
    type: { type: String, enum: ["IMAGE", "VIDEO", "TEXT"], required: true },
    url: { type: String },
    text: { type: String },
    backgroundColor: { type: String, default: "#000000" },
    textColor: { type: String, default: "#FFFFFF" },
    font: { type: String, default: "Arial" },
  },
  duration: { type: Number, default: 5000 }, // in milliseconds
  viewers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      viewedAt: { type: Date, default: Date.now },
    },
  ],
  reactions: [
    {
      emoji: String,
      count: { type: Number, default: 0 },
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  ],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  }, // 24 hours
  isPremium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// 17. AUTOMATION RULE SCHEMA
const AutomationRuleSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  trigger: {
    type: {
      type: String,
      enum: [
        "NEW_MEMBER",
        "KEYWORD",
        "TIME_BASED",
        "USER_ROLE_CHANGE",
        "MESSAGE_COUNT",
      ],
      required: true,
    },
    conditions: [
      {
        field: String,
        operator: String,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  actions: [
    {
      type: {
        type: String,
        enum: [
          "SEND_MESSAGE",
          "ASSIGN_ROLE",
          "DELETE_MESSAGE",
          "PIN_MESSAGE",
          "CREATE_CHANNEL",
          "SEND_ALERT",
        ],
        required: true,
      },
      parameters: mongoose.Schema.Types.Mixed,
    },
  ],
  executionCount: { type: Number, default: 0 },
  lastExecuted: { type: Date },
  isPremium: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = {
  User: mongoose.model("User", UserSchema),
  Post: mongoose.model("Post", PostSchema),
  Report: mongoose.model("Report", ReportsSchema),
  Group: mongoose.model("Group", GroupSchema),
  Message: mongoose.model("Message", MessageSchema),
  Listing: mongoose.model("Listing", ListingSchema),
  MarketplaceConversation: mongoose.model(
    "MarketplaceConversation",
    MarketplaceConversationSchema,
  ),
  MarketplaceReview: mongoose.model(
    "MarketplaceReview",
    MarketplaceReviewSchema,
  ),
  LostFound: mongoose.model("LostFound", LostFoundSchema),
  CollegeTimetable: mongoose.model("CollegeTimetable", CollegeTimetableSchema),
  PersonalTimetable: mongoose.model(
    "PersonalTimetable",
    PersonalTimetableSchema,
  ),
  Attendance: mongoose.model("Attendance", AttendanceSchema),
  NotesLibrary: mongoose.model("NotesLibrary", NotesLibrarySchema),
  Notices: mongoose.model("Notices", NoticesSchema),
  Confessions: mongoose.model("Confessions", ConfessionsSchema),

  // Premium Models
  PremiumSubscription: mongoose.model(
    "PremiumSubscription",
    PremiumSubscriptionSchema,
  ),
  GroupBoost: mongoose.model("GroupBoost", GroupBoostSchema),
  CustomEmojiPack: mongoose.model("CustomEmojiPack", CustomEmojiPackSchema),
  GroupAnalytics: mongoose.model("GroupAnalytics", GroupAnalyticsSchema),
  GroupStory: mongoose.model("GroupStory", GroupStorySchema),
  AutomationRule: mongoose.model("AutomationRule", AutomationRuleSchema),
  Notification: mongoose.model("Notification", NotificationSchema),
};
