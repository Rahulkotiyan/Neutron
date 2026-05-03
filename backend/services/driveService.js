const { google } = require('googleapis');
const path = require('path');

// Load your service account JSON key
const KEYFILEPATH = path.join(__dirname, '../serviceAccountKey1.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// Initialize Auth
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

const fetchNotesFromDrive = async (searchQuery = '') => {
    try {
        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1aBcDeFgHiJkLmNoPqRsTuVwXyZ';
        
        // Helper function for recursive fetching
        const fetchFolderContents = async (folderId, isRoot = true) => {
            let q = `'${folderId}' in parents and trashed = false`;
            
            // If a search query is provided, add it to the API request
            if (searchQuery) {
                q += ` and name contains '${searchQuery}'`;
            }

            const response = await drive.files.list({
                q: q,
                fields: 'files(id, name, mimeType, webViewLink, webContentLink, createdTime, size)',
                orderBy: 'createdTime desc'
            });

            const items = response.data.files;
            if (!items || items.length === 0) return [];

            const result = [];
            
            if (isRoot) {
                for (const item of items) {
                    if (item.mimeType === 'application/vnd.google-apps.folder') {
                        // Recursively fetch contents of this subfolder
                        const subFiles = await fetchFolderContents(item.id, false);
                        if (subFiles.length > 0) {
                            result.push({
                                type: 'group',
                                id: item.id,
                                name: item.name,
                                webViewLink: item.webViewLink,
                                files: subFiles
                            });
                        }
                    } else {
                        // Add regular files to our list
                        result.push({
                            type: 'file',
                            file: item
                        });
                    }
                }
            } else {
                // Inside a subfolder, just flatten everything
                for (const item of items) {
                    if (item.mimeType === 'application/vnd.google-apps.folder') {
                        const subFiles = await fetchFolderContents(item.id, false);
                        result.push(...subFiles);
                    } else {
                        result.push(item);
                    }
                }
            }
            return result;
        };

        // Start the recursive fetch from the root folder
        return await fetchFolderContents(rootFolderId, true);
    } catch (error) {
        console.error('Error fetching from Drive:', error);
        throw error;
    }
};

module.exports = { fetchNotesFromDrive };
