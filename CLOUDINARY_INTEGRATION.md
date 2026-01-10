# Cloudinary Integration Guide

## Overview

This guide explains the Cloudinary integration for the Neutron application. Cloudinary is used to store all photos, videos, documents, and other files in a cloud-based storage system instead of local storage.

## Environment Variables

The following Cloudinary credentials are already configured in `.env`:

```
CLOUDINARY_CLOUD_NAME=dzhkzwne1
CLOUDINARY_API_KEY=497651815465781
CLOUDINARY_API_SECRET=lJ-SdZPN2ySaDEhGdpSUHcylBBc
```

These credentials allow the backend to upload, manage, and delete files from Cloudinary.

## File Structure

### 1. Configuration Files

- **`backend/config/cloudinary.js`** - Cloudinary SDK initialization and configuration

### 2. Middleware

- **`backend/middleware/uploadMiddleware.js`** - Multer storage configuration for different file types

### 3. Utilities

- **`backend/utils/cloudinaryUtils.js`** - Helper functions for file operations

## Supported File Types

| File Type       | Max Size | Folder     |
| --------------- | -------- | ---------- |
| Posts           | 50 MB    | posts      |
| Profile Avatars | 10 MB    | profiles   |
| Listings        | 20 MB    | listings   |
| Notes/Documents | 100 MB   | notes      |
| Lost & Found    | 15 MB    | lost-found |
| Notices         | 30 MB    | notices    |
| Events          | 20 MB    | events     |

### Allowed Formats

- Images: jpg, jpeg, png, gif
- Documents: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip
- Videos: mp4, avi, mov, mkv

## API Endpoints

### Posts with File Upload

```
POST /api/posts
Header: Authorization: Bearer <token>
Body: FormData
  - title: string
  - desc: string
  - tag: string
  - college: string
  - file: File (optional, image/video)
```

### Listings with Image

```
POST /api/listings
Header: Authorization: Bearer <token>
Body: FormData
  - title: string
  - description: string
  - price: number
  - category: string
  - condition: string
  - college: string
  - image: File (optional)

PUT /api/listings/:id
Header: Authorization: Bearer <token>
Body: FormData (same as above)
```

### Lost & Found with Image

```
POST /api/lost-found
Header: Authorization: Bearer <token>
Body: FormData
  - title: string
  - description: string
  - type: string (LOST/FOUND)
  - category: string
  - location: string
  - date: string
  - itemName: string
  - color: string
  - distinguishingMarks: string
  - college: string
  - image: File (optional)
```

### Notes/Documents with File

```
POST /api/notes
Header: Authorization: Bearer <token>
Body: FormData
  - title: string
  - description: string
  - subject: string
  - semester: string
  - branch: string
  - documentType: string
  - college: string
  - tags: string (comma-separated)
  - file: File (required, PDF/Doc)

PUT /api/notes/:id
Header: Authorization: Bearer <token>
Body: FormData (same as above)
```

### Notices with Attachment

```
POST /api/notices
Header: Authorization: Bearer <token>
Body: FormData
  - title: string
  - content: string
  - category: string
  - priority: string
  - college: string
  - file: File (optional)

PUT /api/notices/:id
Header: Authorization: Bearer <token>
Body: FormData (same as above)
```

### Profile with Avatar

```
PUT /api/profile
Header: Authorization: Bearer <token>
Body: FormData
  - name: string
  - bio: string
  - skills: string (comma-separated)
  - college: string
  - branch: string
  - semester: string
  - year: string
  - city: string
  - state: string
  - phoneNumber: string
  - avatar: File (optional, image only)
```

## Frontend Integration

### Example: Creating a Post with Image

```javascript
const formData = new FormData();
formData.append("title", "My Post");
formData.append("desc", "Post description");
formData.append("tag", "GENERAL");
formData.append("college", "AIT Bangalore");
formData.append("file", imageFile); // File object from input

const response = await axios.post("http://localhost:5000/api/posts", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${token}`,
  },
});

// Response includes imageUrl from Cloudinary
console.log(response.data.image); // Cloudinary URL
```

### Example: Creating a Note with PDF

```javascript
const formData = new FormData();
formData.append("title", "DSA Notes");
formData.append("description", "Important algorithms");
formData.append("subject", "Data Structures");
formData.append("semester", "3");
formData.append("branch", "CSE");
formData.append("documentType", "Notes");
formData.append("college", "AIT Bangalore");
formData.append("tags", "algorithms,sorting,searching");
formData.append("file", pdfFile); // File object

const response = await axios.post("http://localhost:5000/api/notes", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${token}`,
  },
});

console.log(response.data.fileUrl); // Direct download link
```

### Example: Upload Progress (Optional)

```javascript
const config = {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${token}`,
  },
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    console.log(`Upload progress: ${percentCompleted}%`);
    // Update UI with progress
  },
};

const response = await axios.post("/api/posts", formData, config);
```

## Utility Functions

### uploadToCloudinary

Upload a local file to Cloudinary.

```javascript
const { uploadToCloudinary } = require("../utils/cloudinaryUtils");

const result = await uploadToCloudinary(
  "/path/to/file",
  "Neutron/posts",
  "auto"
);
// Returns: { url, publicId, size, type, format }
```

### uploadBufferToCloudinary

Upload from buffer (streaming/API data).

```javascript
const { uploadBufferToCloudinary } = require("../utils/cloudinaryUtils");

const result = await uploadBufferToCloudinary(
  buffer,
  "filename.pdf",
  "Neutron/notes",
  "raw"
);
// Returns: { url, publicId, size, type, format }
```

### deleteFromCloudinary

Delete a file from Cloudinary.

```javascript
const { deleteFromCloudinary } = require("../utils/cloudinaryUtils");

await deleteFromCloudinary("Neutron/posts/publicId", "image");
```

### getFileInfo

Get metadata about a file.

```javascript
const { getFileInfo } = require("../utils/cloudinaryUtils");

const info = await getFileInfo("Neutron/posts/publicId");
```

## Database Schema Updates

The following fields now store Cloudinary URLs:

### User Schema

- `avatar: String` - Cloudinary image URL

### Post Schema

- `image: String` - Cloudinary image/video URL

### Listing Schema

- `image: String` - Cloudinary image URL

### LostFound Schema

- `image: String` - Cloudinary image URL

### NotesLibrary Schema

- `fileUrl: String` - Cloudinary document URL
- `fileName: String` - Original file name
- `fileSize: Number` - File size in bytes

### Notices Schema

- `imageUrl: String` - Cloudinary image/document URL (if added)

## Error Handling

All upload endpoints return appropriate error messages:

```javascript
{
  "message": "File upload required"  // Missing file
}

{
  "message": "Cloudinary upload failed: <error>"  // Upload error
}

{
  "message": "Error creating post"  // Generic error
}
```

## File Organization in Cloudinary

All files are organized in folders:

```
Neutron/
  ├── posts/        (images/videos for posts)
  ├── profiles/     (user avatars)
  ├── listings/     (marketplace product images)
  ├── notes/        (uploaded documents)
  ├── lost-found/   (lost/found item images)
  ├── notices/      (notice attachments)
  └── events/       (event images)
```

## Best Practices

1. **Always use FormData** - When sending files from frontend
2. **Include Authorization** - All upload endpoints require JWT token
3. **Handle Progress** - Show upload progress in UI for better UX
4. **Error Handling** - Catch and display upload errors gracefully
5. **File Validation** - Validate file size and type on frontend before upload
6. **Secure URLs** - All URLs are HTTPS and secure

## Troubleshooting

### Upload Fails with "413 Payload Too Large"

- The file exceeds the size limit for that resource type
- Check the "Supported File Types" table above

### "The requested module does not provide an export"

- Ensure all imports use correct casing: `uploadMiddleware` not `uploadmiddleware`

### "Unauthorized: Invalid token"

- Verify the JWT token is included in the Authorization header
- Token format: `Authorization: Bearer <token>`

### Files Not Appearing in Cloudinary Dashboard

- Check the folder path: should be `Neutron/<resource-type>/`
- Verify credentials in `.env` are correct

## Security

- Cloudinary API credentials are stored in `.env` and not exposed to frontend
- All uploads require JWT authentication
- File types are restricted to prevent malicious uploads
- File sizes are limited per resource type
- Public ID ensures unique file names and prevents overwrites

## Performance

- Cloudinary CDN ensures fast delivery globally
- Images are automatically optimized for web
- Supports responsive image transformations
- Built-in caching for repeated requests

## References

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Multer Storage Cloudinary](https://github.com/afzaalkm/multer-storage-cloudinary)
- [Multer Documentation](https://github.com/expressjs/multer)
