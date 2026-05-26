const cron = require('node-cron');
const { getDb, schema } = require('../db');
const { eq, and } = require('drizzle-orm');
const { fetchNotesFromDrive } = require('./driveService');

const buildUrlSet = (items) => {
  const set = new Set();
  for (const item of items) {
    if (item.type === 'group' && item.files) {
      if (item.webViewLink) set.add(item.webViewLink);
      for (const f of item.files) {
        if (f && f.webViewLink) set.add(f.webViewLink);
      }
    } else if (item.type === 'file' && item.file && item.file.webViewLink) {
      set.add(item.file.webViewLink);
    } else if (item.webViewLink) {
      set.add(item.webViewLink);
    }
  }
  return set;
};

const syncGoogleDriveNotes = async () => {
    console.log('[CRON] Starting Google Drive sync...');
    try {
        const files = await fetchNotesFromDrive();
        if (!files || files.length === 0) {
            console.log('[CRON] No files found in Google Drive.');
            return { success: true, count: 0, message: "No files found" };
        }

        const validUrls = buildUrlSet(files);
        const db = getDb();
        let uploaderUser = (await db.select().from(schema.users).where(eq(schema.users.isAdmin, 1)).limit(1))[0];
        if (!uploaderUser) uploaderUser = (await db.select().from(schema.users).limit(1))[0];
        if (!uploaderUser) {
            console.log('[CRON] Error: No users found in database to assign as uploader.');
            return { success: false, message: "No users found in database" };
        }

        // Phase 1: Clean up notes/files deleted from Drive
        let cleanedCount = 0;
        const driveNotes = await db.select().from(schema.notesLibrary).where(eq(schema.notesLibrary.subject, "Drive Sync"));
        for (const note of driveNotes) {
            if (!validUrls.has(note.fileUrl)) {
                console.log(`[CRON] Removing deleted: ${note.title}`);
                await db.delete(schema.notesFiles).where(eq(schema.notesFiles.noteId, note.id));
                await db.delete(schema.notesLibrary).where(eq(schema.notesLibrary.id, note.id));
                cleanedCount++;
            } else if (note.isGroup) {
                const groupFiles = await db.select().from(schema.notesFiles).where(eq(schema.notesFiles.noteId, note.id));
                for (const f of groupFiles) {
                    if (!validUrls.has(f.fileUrl)) {
                        console.log(`[CRON] Removing deleted file: ${f.fileName} from ${note.title}`);
                        await db.delete(schema.notesFiles).where(eq(schema.notesFiles.id, f.id));
                        cleanedCount++;
                    }
                }
            }
        }

        // Phase 2: Sync new notes from Drive
        let syncedCount = 0;
        for (const item of files) {
            if (item.type === 'group' && item.files) {
                const ts = new Date().toISOString();

                let groupId;
                const existingGroup = await db.select().from(schema.notesLibrary).where(eq(schema.notesLibrary.fileUrl, item.webViewLink)).limit(1);
                if (existingGroup.length) {
                    groupId = existingGroup[0].id;
                } else {
                    groupId = require('crypto').randomUUID();
                    await db.insert(schema.notesLibrary).values({
                        id: groupId, title: item.name,
                        description: `Notes from ${item.name}`,
                        subject: "Drive Sync", semester: "ALL", branch: "ALL",
                        documentType: "NOTES", fileUrl: item.webViewLink,
                        fileName: '', fileSize: 0,
                        uploaderId: uploaderUser.id, uploaderName: uploaderUser.name || 'System Admin',
                        uploaderEmail: uploaderUser.email, uploaderAvatar: uploaderUser.avatar,
                        uploaderCollege: uploaderUser.college || 'Global',
                        college: uploaderUser.college || 'Global', isGroup: 1, isApproved: 1,
                        createdAt: ts, updatedAt: ts,
                    });
                    syncedCount++;
                }

                for (const f of item.files) {
                    if (!f || !f.webViewLink) continue;

                    const existingFile = await db.select().from(schema.notesFiles).where(and(eq(schema.notesFiles.noteId, groupId), eq(schema.notesFiles.fileUrl, f.webViewLink))).limit(1);
                    if (!existingFile.length) {
                        await db.insert(schema.notesFiles).values({
                            id: require('crypto').randomUUID(),
                            noteId: groupId,
                            title: f.name.replace(/\.[^/.]+$/, ""),
                            fileUrl: f.webViewLink,
                            fileName: f.name,
                            fileSize: parseInt(f.size || 0),
                            createdAt: ts,
                        });
                    }
                }
            } else if (item.type === 'file') {
                const file = item.file;
                if (!file || !file.webViewLink) continue;

                const existing = await db.select().from(schema.notesLibrary).where(and(eq(schema.notesLibrary.fileUrl, file.webViewLink), eq(schema.notesLibrary.isGroup, 0))).limit(1);
                if (!existing.length) {
                    const id = require('crypto').randomUUID();
                    const ts = new Date().toISOString();
                    await db.insert(schema.notesLibrary).values({
                        id, title: file.name.replace(/\.[^/.]+$/, ""),
                        description: `Automatically synced from Google Drive.`,
                        subject: "Drive Sync", semester: "ALL", branch: "ALL",
                        documentType: "NOTES", fileUrl: file.webViewLink,
                        fileName: file.name, fileSize: parseInt(file.size || 0),
                        uploaderId: uploaderUser.id, uploaderName: uploaderUser.name || 'System Admin',
                        uploaderEmail: uploaderUser.email, uploaderAvatar: uploaderUser.avatar,
                        uploaderCollege: uploaderUser.college || 'Global',
                        college: uploaderUser.college || 'Global', isGroup: 0, isApproved: 1,
                        createdAt: ts, updatedAt: ts,
                    });
                    syncedCount++;
                }
            } else if (item.mimeType && item.webViewLink) {
                const existing = await db.select().from(schema.notesLibrary).where(and(eq(schema.notesLibrary.fileUrl, item.webViewLink), eq(schema.notesLibrary.isGroup, 0))).limit(1);
                if (!existing.length) {
                    const id = require('crypto').randomUUID();
                    const ts = new Date().toISOString();
                    await db.insert(schema.notesLibrary).values({
                        id, title: item.name.replace(/\.[^/.]+$/, ""),
                        description: `Automatically synced from Google Drive.`,
                        subject: "Drive Sync", semester: "ALL", branch: "ALL",
                        documentType: "NOTES", fileUrl: item.webViewLink,
                        fileName: item.name, fileSize: parseInt(item.size || 0),
                        uploaderId: uploaderUser.id, uploaderName: uploaderUser.name || 'System Admin',
                        uploaderEmail: uploaderUser.email, uploaderAvatar: uploaderUser.avatar,
                        uploaderCollege: uploaderUser.college || 'Global',
                        college: uploaderUser.college || 'Global', isGroup: 0, isApproved: 1,
                        createdAt: ts, updatedAt: ts,
                    });
                    syncedCount++;
                }
            }
        }

        console.log(`[CRON] Sync complete! Added ${syncedCount} new, cleaned ${cleanedCount} deleted.`);
        return { success: true, count: syncedCount, cleaned: cleanedCount, message: `Added ${syncedCount} new, cleaned ${cleanedCount} deleted` };
    } catch (error) {
        console.error('[CRON] Error syncing notes from Google Drive:', error);
        return { success: false, message: error.message };
    }
};

const startCronJobs = () => {
    cron.schedule('*/30 * * * *', syncGoogleDriveNotes);
    console.log('Cron jobs started (Google Drive sync scheduled every 30 minutes).');
};

module.exports = { startCronJobs, syncGoogleDriveNotes };
