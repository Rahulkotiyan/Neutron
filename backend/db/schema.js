const { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } = require('drizzle-orm/sqlite-core');

const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  googleId: text('google_id'),
  handle: text('handle'),
  username: text('username').unique(),
  avatar: text('avatar'),
  department: text('department'),
  year: text('year'),
  college: text('college').default('Dr Ambedkar Institute of Technology'),
  branch: text('branch'),
  semester: text('semester'),
  city: text('city'),
  state: text('state'),
  skills: text('skills'),
  bio: text('bio'),
  shortBio: text('short_bio'),
  hasProfile: integer('has_profile').default(0),
  phoneNumber: text('phone_number'),
  banner: text('banner'),
  externalLink: text('external_link'),
  isAdmin: integer('is_admin').default(0),
  isActive: integer('is_active').default(1),
  suspendedUntil: text('suspended_until'),
  publicKey: text('public_key'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => ({
  collegeIdx: index('idx_users_college').on(table.college),
  nameIdx: index('idx_users_name').on(table.name),
  handleIdx: index('idx_users_handle').on(table.handle),
}));

const userFollows = sqliteTable('user_follows', {
  followerId: text('follower_id').notNull(),
  followingId: text('following_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.followerId, table.followingId] }),
  followerIdx: index('idx_user_follows_follower').on(table.followerId),
  followingIdx: index('idx_user_follows_following').on(table.followingId),
}));

const userSavedPosts = sqliteTable('user_saved_posts', {
  userId: text('user_id').notNull(),
  postId: text('post_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.postId] }),
  userIdx: index('idx_saved_posts_user').on(table.userId),
  postIdx: index('idx_saved_posts_post').on(table.postId),
}));

const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title'),
  desc: text('desc'),
  image: text('image'),
  tag: text('tag'),
  author: text('author').notNull(),
  isAnonymous: integer('is_anonymous').default(0),
  college: text('college').default('Global'),
  moderationStatus: text('moderation_status').default('APPROVED'),
  scheduledAt: text('scheduled_at'),
  views: integer('views').default(0),
  eventDate: text('event_date'),
  location: text('location'),
  contactPerson: text('contact_person'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  tags: text('tags'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => ({
  collegeTagCreatedIdx: index('idx_posts_college_tag_created').on(table.college, table.tag, table.createdAt),
  authorIdx: index('idx_posts_author').on(table.author),
}));

const postLikes = sqliteTable('post_likes', {
  postId: text('post_id').notNull(),
  userId: text('user_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.userId] }),
  postIdx: index('idx_post_likes_post').on(table.postId),
  userIdx: index('idx_post_likes_user').on(table.userId),
}));

const postDislikes = sqliteTable('post_dislikes', {
  postId: text('post_id').notNull(),
  userId: text('user_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.userId] }),
  postIdx: index('idx_post_dislikes_post').on(table.postId),
  userIdx: index('idx_post_dislikes_user').on(table.userId),
}));

const postReposts = sqliteTable('post_reposts', {
  postId: text('post_id').notNull(),
  userId: text('user_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.userId] }),
  postIdx: index('idx_post_reposts_post').on(table.postId),
  userIdx: index('idx_post_reposts_user').on(table.userId),
}));

const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull(),
  userId: text('user_id').notNull(),
  text: text('text').notNull(),
  image: text('image'),
  isDeleted: integer('is_deleted').default(0),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => ({
  postIdx: index('idx_comments_post').on(table.postId),
  userIdx: index('idx_comments_user').on(table.userId),
}));

const commentLikes = sqliteTable('comment_likes', {
  commentId: text('comment_id').notNull(),
  userId: text('user_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.commentId, table.userId] }),
  commentIdx: index('idx_comment_likes_comment').on(table.commentId),
  userIdx: index('idx_comment_likes_user').on(table.userId),
}));

const replies = sqliteTable('replies', {
  id: text('id').primaryKey(),
  commentId: text('comment_id').notNull(),
  userId: text('user_id').notNull(),
  text: text('text').notNull(),
  image: text('image'),
  isDeleted: integer('is_deleted').default(0),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => ({
  commentIdx: index('idx_replies_comment').on(table.commentId),
  userIdx: index('idx_replies_user').on(table.userId),
}));

const replyLikes = sqliteTable('reply_likes', {
  replyId: text('reply_id').notNull(),
  userId: text('user_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.replyId, table.userId] }),
  replyIdx: index('idx_reply_likes_reply').on(table.replyId),
  userIdx: index('idx_reply_likes_user').on(table.userId),
}));

const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').notNull(),
  targetId: text('target_id').notNull(),
  targetType: text('target_type').notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('PENDING'),
  createdAt: text('created_at'),
}, (table) => ({
  targetStatusIdx: index('idx_reports_target_status').on(table.targetId, table.status),
  reporterTargetIdx: uniqueIndex('idx_reports_reporter_target').on(table.reporterId, table.targetId),
  createdIdx: index('idx_reports_created').on(table.createdAt),
}));

const collegeTimetables = sqliteTable('college_timetables', {
  id: text('id').primaryKey(),
  college: text('college').notNull(),
  branch: text('branch').notNull(),
  semester: text('semester').notNull(),
}, (table) => ({
  collegeBranchSemesterIdx: index('idx_ct_college_branch_semester').on(table.college, table.branch, table.semester),
}));

const timetableSchedules = sqliteTable('timetable_schedules', {
  id: text('id').primaryKey(),
  timetableId: text('timetable_id').notNull(),
  day: text('day').notNull(),
}, (table) => ({
  timetableIdx: index('idx_tt_schedules_timetable').on(table.timetableId),
}));

const timetableClasses = sqliteTable('timetable_classes', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').notNull(),
  timeSlot: text('time_slot'),
  subject: text('subject'),
  subjectCode: text('subject_code'),
  professor: text('professor'),
  room: text('room'),
  type: text('type'),
}, (table) => ({
  scheduleIdx: index('idx_tt_classes_schedule').on(table.scheduleId),
}));

const personalTimetables = sqliteTable('personal_timetables', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  college: text('college').default('Dr Ambedkar Institute of Technology'),
  colorScheme: text('color_scheme'),
  viewMode: text('view_mode').default('WEEK'),
}, (table) => ({
  userIdx: index('idx_pt_user').on(table.userId),
}));

const personalSchedules = sqliteTable('personal_schedules', {
  id: text('id').primaryKey(),
  timetableId: text('timetable_id').notNull(),
  day: text('day').notNull(),
}, (table) => ({
  timetableIdx: index('idx_ps_timetable').on(table.timetableId),
}));

const personalClasses = sqliteTable('personal_classes', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').notNull(),
  timeSlot: text('time_slot'),
  startTime: text('start_time'),
  endTime: text('end_time'),
  subject: text('subject'),
  subjectCode: text('subject_code'),
  type: text('type'),
  customNote: text('custom_note'),
  color: text('color').default('#3498db'),
  isEdited: integer('is_edited').default(0),
  editedAt: text('edited_at'),
  isOptional: integer('is_optional').default(0),
  notificationsEnabled: integer('notifications_enabled').default(0),
  notificationTimes: text('notification_times'),
}, (table) => ({
  scheduleIdx: index('idx_pc_schedule').on(table.scheduleId),
}));

const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  college: text('college').default('AIT Bangalore'),
}, (table) => ({
  userIdx: index('idx_attendance_user').on(table.userId),
}));

const attendanceSubjects = sqliteTable('attendance_subjects', {
  id: text('id').primaryKey(),
  attendanceId: text('attendance_id').notNull(),
  subjectCode: text('subject_code'),
  subjectName: text('subject_name'),
  totalClasses: integer('total_classes').default(0),
  classesAttended: integer('classes_attended').default(0),
  classesSkipped: integer('classes_skipped').default(0),
  leaveClasses: integer('leave_classes').default(0),
  cancelledClasses: integer('cancelled_classes').default(0),
  lastUpdated: text('last_updated'),
}, (table) => ({
  attendanceIdx: index('idx_att_subjects_attendance').on(table.attendanceId),
}));

const attendanceRecords = sqliteTable('attendance_records', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').notNull(),
  date: text('date'),
  timeSlot: text('time_slot'),
  status: text('status'),
  markedAt: text('marked_at'),
  markedBy: text('marked_by'),
}, (table) => ({
  subjectIdx: index('idx_att_records_subject').on(table.subjectId),
}));

const notesLibrary = sqliteTable('notes_library', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  subject: text('subject').notNull(),
  semester: text('semester').notNull(),
  branch: text('branch'),
  documentType: text('document_type').notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'),
  downloads: integer('downloads').default(0),
  uploaderId: text('uploader_id').notNull(),
  uploaderName: text('uploader_name'),
  uploaderEmail: text('uploader_email'),
  uploaderAvatar: text('uploader_avatar'),
  uploaderCollege: text('uploader_college'),
  college: text('college').default('Global'),
  tags: text('tags'),
  views: integer('views').default(0),
  rating: real('rating').default(0),
  ratingCount: integer('rating_count').default(0),
  isApproved: integer('is_approved').default(1),
  isGroup: integer('is_group').default(0),
  visibility: text('visibility').default('PUBLIC'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => ({
  subjectSemesterBranchIdx: index('idx_notes_subject_semester_branch').on(table.subject, table.semester, table.branch),
  uploaderIdx: index('idx_notes_uploader').on(table.uploaderId),
  approvedCreatedIdx: index('idx_notes_approved_created').on(table.isApproved, table.createdAt),
  collegeIdx: index('idx_notes_college').on(table.college),
}));

const notesLikes = sqliteTable('notes_likes', {
  noteId: text('note_id').notNull(),
  userId: text('user_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.userId] }),
  noteIdx: index('idx_note_likes_note').on(table.noteId),
  userIdx: index('idx_note_likes_user').on(table.userId),
}));

const notesComments = sqliteTable('notes_comments', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name'),
  userAvatar: text('user_avatar'),
  text: text('text').notNull(),
  createdAt: text('created_at'),
}, (table) => ({
  noteIdx: index('idx_note_comments_note').on(table.noteId),
}));

const notesFiles = sqliteTable('notes_files', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull(),
  title: text('title'),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  createdAt: text('created_at'),
}, (table) => ({
  noteIdx: index('idx_notes_files_note').on(table.noteId),
}));

const notices = sqliteTable('notices', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  noticeType: text('notice_type').notNull(),
  category: text('category').notNull(),
  priority: text('priority').default('NORMAL'),
  imageUrl: text('image_url'),
  posterUrl: text('poster_url'),
  eventDate: text('event_date'),
  location: text('location'),
  contactPerson: text('contact_person'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  publisherId: text('publisher_id').notNull(),
  publisherName: text('publisher_name'),
  publisherEmail: text('publisher_email'),
  publisherAvatar: text('publisher_avatar'),
  publisherDepartment: text('publisher_department'),
  publisherCollege: text('publisher_college'),
  college: text('college').default('Global'),
  isOfficial: integer('is_official').default(0),
  approvedBy: text('approved_by'),
  approvedAt: text('approved_at'),
  pinned: integer('pinned').default(0),
  views: integer('views').default(0),
  tags: text('tags'),
  status: text('status').default('PUBLISHED'),
  expiryDate: text('expiry_date'),
  visibility: text('visibility').default('PUBLIC'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => ({
  collegeStatusCreatedIdx: index('idx_notices_college_status_created').on(table.college, table.status, table.createdAt),
  publisherIdx: index('idx_notices_publisher').on(table.publisherId),
}));

const noticeAttachments = sqliteTable('notice_attachments', {
  id: text('id').primaryKey(),
  noticeId: text('notice_id').notNull(),
  name: text('name'),
  url: text('url'),
}, (table) => ({
  noticeIdx: index('idx_notice_attachments_notice').on(table.noticeId),
}));

const noticeComments = sqliteTable('notice_comments', {
  id: text('id').primaryKey(),
  noticeId: text('notice_id').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name'),
  userAvatar: text('user_avatar'),
  text: text('text').notNull(),
  createdAt: text('created_at'),
}, (table) => ({
  noticeIdx: index('idx_notice_comments_notice').on(table.noticeId),
}));

const noticeLikes = sqliteTable('notice_likes', {
  noticeId: text('notice_id').notNull(),
  userId: text('user_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.noticeId, table.userId] }),
  noticeIdx: index('idx_notice_likes_notice').on(table.noticeId),
  userIdx: index('idx_notice_likes_user').on(table.userId),
}));

const noticeShares = sqliteTable('notice_shares', {
  noticeId: text('notice_id').notNull(),
  userId: text('user_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.noticeId, table.userId] }),
  noticeIdx: index('idx_notice_shares_notice').on(table.noticeId),
  userIdx: index('idx_notice_shares_user').on(table.userId),
}));

const confessions = sqliteTable('confessions', {
  id: text('id').primaryKey(),
  confession: text('confession').notNull(),
  category: text('category').default('PERSONAL'),
  tags: text('tags'),
  userId: text('user_id'),
  confessionHash: text('confession_hash'),
  views: integer('views').default(0),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => ({
  categoryCreatedIdx: index('idx_confessions_category_created').on(table.category, table.createdAt),
  userIdx: index('idx_confessions_user').on(table.userId),
}));

const confessionLikes = sqliteTable('confession_likes', {
  confessionId: text('confession_id').notNull(),
  userId: text('user_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.confessionId, table.userId] }),
  confessionIdx: index('idx_confession_likes_confession').on(table.confessionId),
  userIdx: index('idx_confession_likes_user').on(table.userId),
}));

const confessionComments = sqliteTable('confession_comments', {
  id: text('id').primaryKey(),
  confessionId: text('confession_id').notNull(),
  text: text('text').notNull(),
  userHash: text('user_hash'),
  createdAt: text('created_at'),
}, (table) => ({
  confessionIdx: index('idx_confession_comments_confession').on(table.confessionId),
}));

const confessionShares = sqliteTable('confession_shares', {
  confessionId: text('confession_id').notNull(),
  userId: text('user_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.confessionId, table.userId] }),
  confessionIdx: index('idx_confession_shares_confession').on(table.confessionId),
  userIdx: index('idx_confession_shares_user').on(table.userId),
}));

const studentExams = sqliteTable('student_exams', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  subject: text('subject').notNull(),
  subjectCode: text('subject_code').notNull(),
  examDate: text('exam_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  duration: integer('duration').notNull(),
  room: text('room'),
  building: text('building'),
  totalMarks: integer('total_marks'),
  instructions: text('instructions'),
  notificationsEnabled: integer('notifications_enabled').default(0),
  notificationTimes: text('notification_times'),
  type: text('type').default('EXTERNAL'),
  status: text('status').default('UPCOMING'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => ({
  userExamDateIdx: index('idx_exams_user_date').on(table.userId, table.examDate),
}));

const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  recipient: text('recipient').notNull(),
  sender: text('sender').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: text('related_entity_id'),
  isRead: integer('is_read').default(0),
  readAt: text('read_at'),
  createdAt: text('created_at'),
}, (table) => ({
  recipientCreatedIdx: index('idx_notifications_recipient_created').on(table.recipient, table.createdAt),
  recipientReadIdx: index('idx_notifications_recipient_read').on(table.recipient, table.isRead),
}));

const colleges = sqliteTable('colleges', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  isActive: integer('is_active').default(1),
});

const branches = sqliteTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  isActive: integer('is_active').default(1),
});

const toolCategories = sqliteTable('tool_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull(),
  displayOrder: integer('display_order').default(0),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at'),
});

const toolSubcategories = sqliteTable('tool_subcategories', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => toolCategories.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  displayOrder: integer('display_order').default(0),
  createdAt: text('created_at'),
});

const tools = sqliteTable('tools', {
  id: text('id').primaryKey(),
  subcategoryId: text('subcategory_id').notNull().references(() => toolSubcategories.id),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  icon: text('icon'),
  displayOrder: integer('display_order').default(0),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at'),
});

const toolStars = sqliteTable('tool_stars', {
  toolId: text('tool_id').notNull(),
  userId: text('user_id').notNull(),
  createdAt: text('created_at'),
}, (table) => ({
  pk: primaryKey({ columns: [table.toolId, table.userId] }),
  toolIdx: index('idx_tool_stars_tool').on(table.toolId),
  userIdx: index('idx_tool_stars_user').on(table.userId),
}));

module.exports = {
  users,
  userFollows,
  userSavedPosts,
  posts,
  postLikes,
  postDislikes,
  postReposts,
  comments,
  commentLikes,
  replies,
  replyLikes,
  reports,
  collegeTimetables,
  timetableSchedules,
  timetableClasses,
  personalTimetables,
  personalSchedules,
  personalClasses,
  attendance,
  attendanceSubjects,
  attendanceRecords,
  notesLibrary,
  notesLikes,
  notesComments,
  notesFiles,
  notices,
  noticeAttachments,
  noticeComments,
  noticeLikes,
  noticeShares,
  confessions,
  confessionLikes,
  confessionComments,
  confessionShares,
  studentExams,
  notifications,
  colleges,
  branches,
  toolCategories,
  toolSubcategories,
  tools,
  toolStars,
};
