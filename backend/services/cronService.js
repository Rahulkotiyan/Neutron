const cron = require('node-cron');
const { getDb, schema } = require('../db');
const { eq } = require('drizzle-orm');
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
            if (item.type === 'file') {
                const file = item.file;
                const existing = await db.select().from(schema.notesLibrary).where(eq(schema.notesLibrary.fileUrl, file.webViewLink)).limit(1);
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
