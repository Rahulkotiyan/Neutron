require("dotenv").config();
const { createClient } = require("@libsql/client");

async function migrate() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("TURSO_DATABASE_URL not set in .env");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  await client.execute(`PRAGMA foreign_keys = OFF`);

  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password TEXT, google_id TEXT, handle TEXT, username TEXT UNIQUE,
      avatar TEXT, department TEXT, year TEXT,
      college TEXT DEFAULT 'Dr Ambedkar Institute of Technology',
      branch TEXT, semester TEXT, city TEXT, state TEXT, skills TEXT,
      bio TEXT, short_bio TEXT, has_profile INTEGER DEFAULT 0,
      phone_number TEXT, banner TEXT, external_link TEXT,
      is_admin INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1,
      suspended_until TEXT, public_key TEXT, created_at TEXT, updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS user_follows (
      follower_id TEXT NOT NULL, following_id TEXT NOT NULL,
      PRIMARY KEY (follower_id, following_id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_saved_posts (
      user_id TEXT NOT NULL, post_id TEXT NOT NULL,
      PRIMARY KEY (user_id, post_id)
    )`,
    `CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY, title TEXT, desc TEXT, image TEXT, tag TEXT,
      author TEXT NOT NULL, is_anonymous INTEGER DEFAULT 0,
      college TEXT DEFAULT 'Global',
      moderation_status TEXT DEFAULT 'APPROVED', scheduled_at TEXT,
      views INTEGER DEFAULT 0, event_date TEXT, location TEXT,
      contact_person TEXT, contact_phone TEXT, contact_email TEXT,
      tags TEXT, created_at TEXT, updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS post_likes (
      post_id TEXT NOT NULL, user_id TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS post_dislikes (
      post_id TEXT NOT NULL, user_id TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS post_reposts (
      post_id TEXT NOT NULL, user_id TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY, post_id TEXT NOT NULL, user_id TEXT NOT NULL,
      text TEXT NOT NULL, image TEXT, is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT, created_at TEXT, updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS comment_likes (
      comment_id TEXT NOT NULL, user_id TEXT NOT NULL,
      PRIMARY KEY (comment_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS replies (
      id TEXT PRIMARY KEY, comment_id TEXT NOT NULL, user_id TEXT NOT NULL,
      text TEXT NOT NULL, image TEXT, is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT, created_at TEXT, updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS reply_likes (
      reply_id TEXT NOT NULL, user_id TEXT NOT NULL,
      PRIMARY KEY (reply_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL,
      target_id TEXT NOT NULL, target_type TEXT NOT NULL,
      reason TEXT NOT NULL, status TEXT DEFAULT 'PENDING', created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS colleges (
      id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE, is_active INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS college_timetables (
      id TEXT PRIMARY KEY, college TEXT NOT NULL,
      branch TEXT NOT NULL, semester TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS timetable_schedules (
      id TEXT PRIMARY KEY, timetable_id TEXT NOT NULL, day TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS timetable_classes (
      id TEXT PRIMARY KEY, schedule_id TEXT NOT NULL,
      time_slot TEXT, subject TEXT, subject_code TEXT,
      professor TEXT, room TEXT, type TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS personal_timetables (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE,
      college TEXT DEFAULT 'Dr Ambedkar Institute of Technology',
      color_scheme TEXT, view_mode TEXT DEFAULT 'WEEK'
    )`,
    `CREATE TABLE IF NOT EXISTS personal_schedules (
      id TEXT PRIMARY KEY, timetable_id TEXT NOT NULL, day TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS personal_classes (
      id TEXT PRIMARY KEY, schedule_id TEXT NOT NULL,
      time_slot TEXT, start_time TEXT, end_time TEXT,
      subject TEXT, subject_code TEXT, type TEXT,
      custom_note TEXT, color TEXT DEFAULT '#3498db',
      is_edited INTEGER DEFAULT 0, edited_at TEXT,
      is_optional INTEGER DEFAULT 0,
      notifications_enabled INTEGER DEFAULT 0,
      notification_times TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      college TEXT DEFAULT 'AIT Bangalore'
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_subjects (
      id TEXT PRIMARY KEY, attendance_id TEXT NOT NULL,
      subject_code TEXT, subject_name TEXT,
      total_classes INTEGER DEFAULT 0,
      classes_attended INTEGER DEFAULT 0,
      classes_skipped INTEGER DEFAULT 0,
      leave_classes INTEGER DEFAULT 0,
      cancelled_classes INTEGER DEFAULT 0, last_updated TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY, subject_id TEXT NOT NULL,
      date TEXT, time_slot TEXT, status TEXT,
      marked_at TEXT, marked_by TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS notes_library (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      subject TEXT NOT NULL, semester TEXT NOT NULL, branch TEXT,
      document_type TEXT NOT NULL, file_url TEXT NOT NULL,
      file_name TEXT NOT NULL, file_size INTEGER,
      downloads INTEGER DEFAULT 0,
      uploader_id TEXT NOT NULL, uploader_name TEXT,
      uploader_email TEXT, uploader_avatar TEXT,
      uploader_college TEXT, college TEXT DEFAULT 'Global',
      tags TEXT, views INTEGER DEFAULT 0,
      rating REAL DEFAULT 0, rating_count INTEGER DEFAULT 0,
      is_approved INTEGER DEFAULT 1, is_group INTEGER DEFAULT 0,
      visibility TEXT DEFAULT 'PUBLIC', created_at TEXT, updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS notes_likes (
      note_id TEXT NOT NULL, user_id TEXT NOT NULL,
      PRIMARY KEY (note_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS notes_comments (
      id TEXT PRIMARY KEY, note_id TEXT NOT NULL,
      user_id TEXT NOT NULL, user_name TEXT, user_avatar TEXT,
      text TEXT NOT NULL, created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS notes_files (
      id TEXT PRIMARY KEY, note_id TEXT NOT NULL, title TEXT,
      file_url TEXT, file_name TEXT, file_size INTEGER, created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY, title TEXT NOT NULL,
      description TEXT NOT NULL, notice_type TEXT NOT NULL,
      category TEXT NOT NULL, priority TEXT DEFAULT 'NORMAL',
      image_url TEXT, poster_url TEXT, event_date TEXT,
      location TEXT, contact_person TEXT, contact_phone TEXT,
      contact_email TEXT,
      publisher_id TEXT NOT NULL, publisher_name TEXT,
      publisher_email TEXT, publisher_avatar TEXT,
      publisher_department TEXT, publisher_college TEXT,
      college TEXT DEFAULT 'Global', is_official INTEGER DEFAULT 0,
      approved_by TEXT, approved_at TEXT, pinned INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0, tags TEXT,
      status TEXT DEFAULT 'PUBLISHED', expiry_date TEXT,
      visibility TEXT DEFAULT 'PUBLIC', created_at TEXT, updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS notice_attachments (
      id TEXT PRIMARY KEY, notice_id TEXT NOT NULL,
      name TEXT, url TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS notice_comments (
      id TEXT PRIMARY KEY, notice_id TEXT NOT NULL,
      user_id TEXT NOT NULL, user_name TEXT, user_avatar TEXT,
      text TEXT NOT NULL, created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS notice_likes (
      notice_id TEXT NOT NULL, user_id TEXT NOT NULL,
      PRIMARY KEY (notice_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS notice_shares (
      notice_id TEXT NOT NULL, user_id TEXT NOT NULL,
      PRIMARY KEY (notice_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS confessions (
      id TEXT PRIMARY KEY, confession TEXT NOT NULL,
      category TEXT DEFAULT 'PERSONAL', tags TEXT, user_id TEXT,
      confession_hash TEXT, views INTEGER DEFAULT 0,
      created_at TEXT, updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS confession_likes (
      confession_id TEXT NOT NULL, user_id TEXT NOT NULL,
      PRIMARY KEY (confession_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS confession_comments (
      id TEXT PRIMARY KEY, confession_id TEXT NOT NULL,
      text TEXT NOT NULL, user_hash TEXT, created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS confession_shares (
      confession_id TEXT NOT NULL, user_id TEXT NOT NULL,
      PRIMARY KEY (confession_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS student_exams (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      subject TEXT NOT NULL, subject_code TEXT NOT NULL,
      exam_date TEXT NOT NULL, start_time TEXT NOT NULL,
      end_time TEXT NOT NULL, duration INTEGER NOT NULL,
      room TEXT, building TEXT, total_marks INTEGER,
      instructions TEXT, notifications_enabled INTEGER DEFAULT 0,
      notification_times TEXT, type TEXT DEFAULT 'EXTERNAL',
      status TEXT DEFAULT 'UPCOMING', created_at TEXT, updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, recipient TEXT NOT NULL,
      sender TEXT NOT NULL, type TEXT NOT NULL,
      title TEXT NOT NULL, message TEXT NOT NULL,
      related_entity_type TEXT, related_entity_id TEXT,
      is_read INTEGER DEFAULT 0, read_at TEXT, created_at TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_users_college ON users(college)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_college_tag_created ON posts(college, tag, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)`,
    `CREATE INDEX IF NOT EXISTS idx_reports_target_status ON reports(target_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient, is_read)`,
    `CREATE INDEX IF NOT EXISTS idx_notes_subject_semester_branch ON notes_library(subject, semester, branch)`,
    `CREATE INDEX IF NOT EXISTS idx_ct_college_branch_semester ON college_timetables(college, branch, semester)`,
    `CREATE INDEX IF NOT EXISTS idx_confessions_category_created ON confessions(category, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_exams_user_date ON student_exams(user_id, exam_date)`,
    `CREATE TABLE IF NOT EXISTS tool_categories (
      id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE, icon TEXT NOT NULL,
      display_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1,
      created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tool_subcategories (
      id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES tool_categories(id),
      name TEXT NOT NULL, slug TEXT NOT NULL,
      icon TEXT, display_order INTEGER DEFAULT 0,
      created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY, subcategory_id TEXT NOT NULL REFERENCES tool_subcategories(id),
      title TEXT NOT NULL, description TEXT,
      url TEXT NOT NULL, icon TEXT,
      display_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1,
      created_at TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_tool_subcategories_category ON tool_subcategories(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tools_subcategory ON tools(subcategory_id)`,
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }

  await client.execute(`PRAGMA foreign_keys = ON`);
  console.log("Migration complete: all tables created");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
