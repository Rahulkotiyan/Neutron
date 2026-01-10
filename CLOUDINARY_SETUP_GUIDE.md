# Cloudinary Setup - Quick Reference

## ✅ What's Already Done

### Backend Configuration

- ✅ `backend/config/cloudinary.js` - Cloudinary SDK initialized
- ✅ `backend/middleware/uploadMiddleware.js` - Multer + Cloudinary storage configured
- ✅ `backend/utils/cloudinaryUtils.js` - Helper functions created

### Routes Updated with File Upload Support

- ✅ `/api/posts` - File upload enabled
- ✅ `/api/listings` - Image upload enabled
- ✅ `/api/lost-found` - Image upload enabled
- ✅ `/api/notes` - Document upload enabled
- ✅ `/api/profile` - Avatar upload enabled
- ✅ `/api/notices` - File upload enabled

### Controllers Updated

- ✅ `postController.js` - Handles file upload
- ✅ `listingController.js` - Handles image upload
- ✅ `notesController.js` - Handles document upload
- ✅ `profileController.js` - Handles avatar upload

## 📦 Dependencies Already Installed

```json
{
  "cloudinary": "^1.41.3",
  "multer": "^2.0.2",
  "multer-storage-cloudinary": "^4.0.0"
}
```

## 🚀 Next Steps - Frontend Updates

### 1. Update CreatePostModal.jsx

```jsx
const [file, setFile] = useState(null);

const handleFileChange = (e) => {
  setFile(e.target.files[0]);
};

const handleSubmit = async (e) => {
  const formData = new FormData();
  formData.append("title", postData.title);
  formData.append("desc", postData.desc);
  formData.append("tag", postData.tag);
  formData.append("college", userCollege);

  if (file) {
    formData.append("file", file);
  }

  const response = await axios.post("/api/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
};
```

### 2. Update MarketPage.jsx

```jsx
const [image, setImage] = useState(null);

const handleCreateListing = async () => {
  const formData = new FormData();
  formData.append("title", listing.title);
  formData.append("description", listing.description);
  formData.append("price", listing.price);
  formData.append("category", listing.category);
  formData.append("condition", listing.condition);

  if (image) {
    formData.append("image", image);
  }

  const response = await axios.post("/api/listings", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
};
```

### 3. Update NotesLibraryPage.jsx

```jsx
const [file, setFile] = useState(null);

const handleUploadNote = async () => {
  const formData = new FormData();
  formData.append("title", noteData.title);
  formData.append("description", noteData.description);
  formData.append("subject", noteData.subject);
  formData.append("semester", noteData.semester);
  formData.append("branch", noteData.branch);
  formData.append("documentType", noteData.documentType);
  formData.append("tags", noteData.tags);

  if (file) {
    formData.append("file", file);
  }

  const response = await axios.post("/api/notes", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
};
```

### 4. Update ProfilePage.jsx

```jsx
const [avatarFile, setAvatarFile] = useState(null);

const handleAvatarChange = (e) => {
  setAvatarFile(e.target.files[0]);
};

const handleUpdateProfile = async () => {
  const formData = new FormData();
  formData.append("name", profile.name);
  formData.append("bio", profile.bio);
  formData.append("college", profile.college);
  formData.append("branch", profile.branch);

  if (avatarFile) {
    formData.append("avatar", avatarFile);
  }

  const response = await axios.put("/api/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
};
```

## 🔧 Testing the Integration

### Test POST with Image

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Post" \
  -F "desc=Test Description" \
  -F "tag=GENERAL" \
  -F "file=@/path/to/image.jpg"
```

### Test Listing with Image

```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Used Laptop" \
  -F "description=HP Pavilion" \
  -F "price=25000" \
  -F "category=LAPTOPS" \
  -F "image=@/path/to/image.jpg"
```

### Test Note Upload

```bash
curl -X POST http://localhost:5000/api/notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=DSA Notes" \
  -F "subject=DSA" \
  -F "semester=3" \
  -F "branch=CSE" \
  -F "file=@/path/to/notes.pdf"
```

## 📊 Cloudinary Limits

- Free tier: 25GB storage, 25M transformations/month
- Auto-deletion: Oldest files deleted if quota exceeded
- Bandwidth: Included in plan

## 💾 Database Values

After upload, these URLs are stored in database:

```javascript
// Posts
{
  image: "https://res.cloudinary.com/dzhkzwne1/image/upload/..."
}

// Listings
{
  image: "https://res.cloudinary.com/dzhkzwne1/image/upload/..."
}

// Notes
{
  fileUrl: "https://res.cloudinary.com/dzhkzwne1/raw/upload/...",
  fileName: "notes.pdf",
  fileSize: 2097152
}

// Profile
{
  avatar: "https://res.cloudinary.com/dzhkzwne1/image/upload/..."
}
```

## ⚠️ Important Notes

1. **FormData Required**: Always use FormData for file uploads
2. **Multipart Header**: Backend automatically sets this with multer
3. **File Size**: Each resource type has different limits (see limits table)
4. **Token Required**: All upload endpoints require JWT authentication
5. **CORS**: Already configured in backend

## 🎯 Feature Breakdown

| Feature               | Status  | Endpoint               |
| --------------------- | ------- | ---------------------- |
| Post with Image/Video | ✅ Done | `POST /api/posts`      |
| Listing with Image    | ✅ Done | `POST /api/listings`   |
| Lost & Found Image    | ✅ Done | `POST /api/lost-found` |
| Notes Document        | ✅ Done | `POST /api/notes`      |
| Profile Avatar        | ✅ Done | `PUT /api/profile`     |
| Notices Attachment    | ✅ Done | `POST /api/notices`    |

## 📝 Configuration Summary

```
.env
├── CLOUDINARY_CLOUD_NAME: dzhkzwne1
├── CLOUDINARY_API_KEY: 497651815465781
└── CLOUDINARY_API_SECRET: lJ-SdZPN2ySaDEhGdpSUHcylBBc

backend/config/
└── cloudinary.js (initialized and configured)

backend/middleware/
└── uploadMiddleware.js (6 upload instances configured)

backend/utils/
└── cloudinaryUtils.js (4 utility functions)

Routes Updated:
├── postRoutes.js
├── listingRoutes.js
├── lostFoundRoutes.js
├── notesRoutes.js
├── profileRoutes.js
└── noticesRoutes.js
```

## 🔍 Verify Installation

1. Run backend server
2. Check logs for Cloudinary initialization
3. Try uploading a file via API
4. Check Cloudinary dashboard for uploaded files
5. Verify URL is stored in database

## 📞 Support

For issues:

1. Check logs: `node index.js` in backend folder
2. Verify .env credentials
3. Check file size limits
4. Verify JWT token in Authorization header
5. Check Cloudinary dashboard for quota usage
