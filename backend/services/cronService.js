const cron = require('node-cron');
const { fetchNotesFromDrive } = require('./driveService');
const { NotesLibrary, User } = require('../models/Schema');

const syncGoogleDriveNotes = async () => {
    console.log('[CRON] Starting Google Drive sync...');
    try {
        const files = await fetchNotesFromDrive();
        if (!files || files.length === 0) {
            console.log('[CRON] No files found in Google Drive.');
            return { success: true, count: 0, message: "No files found" };
        }

        // Find an admin user to assign as uploader
        let uploaderUser = await User.findOne({ isAdmin: true });
        if (!uploaderUser) {
            // Fallback to any user if no admin exists
            uploaderUser = await User.findOne();
            if (!uploaderUser) {
                console.log('[CRON] Error: No users found in database to assign as uploader.');
                return { success: false, message: "No users found in database" };
            }
        }

        const uploader = {
            _id: uploaderUser._id,
            name: uploaderUser.name || 'System Admin',
            email: uploaderUser.email,
            avatar: uploaderUser.avatar,
            college: uploaderUser.college || 'Global',
        };

        let syncedCount = 0;

        for (const item of files) {
            if (item.type === 'group') {
                const existingNote = await NotesLibrary.findOne({ fileUrl: item.webViewLink });
                if (!existingNote) {
                    const newNote = {
                        title: item.name,
                        description: `Automatically synced from Google Drive Folder.`,
                        subject: "Drive Sync",
                        semester: "ALL",
                        branch: "ALL",
                        documentType: "NOTES",
                        fileUrl: item.webViewLink,
                        fileName: item.name,
                        fileSize: 0,
                        uploader: uploader,
                        college: uploader.college,
                        isGroup: true,
                        isApproved: true,
                        files: item.files.map(f => ({
                            title: f.name.replace(/\.[^/.]+$/, ""),
                            fileUrl: f.webViewLink,
                            fileName: f.name,
                            fileSize: parseInt(f.size || 0)
                        }))
                    };
                    await NotesLibrary.create(newNote);
                    syncedCount++;
                } else {
                    // Update files in case new files were added to the Drive folder
                    existingNote.files = item.files.map(f => ({
                        title: f.name.replace(/\.[^/.]+$/, ""),
                        fileUrl: f.webViewLink,
                        fileName: f.name,
                        fileSize: parseInt(f.size || 0)
                    }));
                    await existingNote.save();
                }
            } else if (item.type === 'file') {
                const file = item.file;
                const existingNote = await NotesLibrary.findOne({ fileUrl: file.webViewLink });

                if (!existingNote) {
                    const newNote = {
                        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
                        description: `Automatically synced from Google Drive.`,
                        subject: "Drive Sync", // Default subject
                        semester: "ALL", // Default semester
                        branch: "ALL", // Default branch
                        documentType: "NOTES",
                        fileUrl: file.webViewLink,
                        fileName: file.name,
                        fileSize: parseInt(file.size || 0),
                        uploader: uploader,
                        college: uploader.college,
                        isGroup: false,
                        isApproved: true,
                        files: [{
                            title: file.name,
                            fileUrl: file.webViewLink,
                            fileName: file.name,
                            fileSize: parseInt(file.size || 0)
                        }]
                    };

                    await NotesLibrary.create(newNote);
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

// Run every 30 minutes
const startCronJobs = () => {
    cron.schedule('*/30 * * * *', syncGoogleDriveNotes);
    console.log('Cron jobs started (Google Drive sync scheduled every 30 minutes).');
};

module.exports = { startCronJobs, syncGoogleDriveNotes };
