const cron = require('node-cron');
const { getDb, schema } = require('../db');
const { eq, and } = require('drizzle-orm');
const { fetchNotesFromDrive } = require('./driveService');

const syncGoogleDriveNotes = async () => {
    console.log('[CRON] Starting Google Drive sync...');
    try {
        const files = await fetchNotesFromDrive();
        if (!files || files.length === 0) {
            console.log('[CRON] No files found in Google Drive.');
            return { success: true, count: 0, message: "No files found" };
        }

        const db = getDb();
        let uploaderUser = (await db.select().from(schema.users).where(eq(schema.users.isAdmin, 1)).limit(1))[0];
        if (!uploaderUser) uploaderUser = (await db.select().from(schema.users).limit(1))[0];
        if (!uploaderUser) {
            console.log('[CRON] Error: No users found in database to assign as uploader.');
            return { success: false, message: "No users found in database" };
        }

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

                    const dupNote = await db.select({ id: schema.notesLibrary.id }).from(schema.notesLibrary).where(and(eq(schema.notesLibrary.fileUrl, f.webViewLink), eq(schema.notesLibrary.isGroup, 0))).limit(1);
                    if (dupNote.length && dupNote[0].id !== groupId) {
                        await db.delete(schema.notesLibrary).where(eq(schema.notesLibrary.id, dupNote[0].id));
                        console.log(`[CRON] Cleaned up duplicate individual note for ${f.name}`);
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

        console.log(`[CRON] Sync complete! Added ${syncedCount} new notes from Google Drive.`);
        return { success: true, count: syncedCount, message: `Added ${syncedCount} new notes` };
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
