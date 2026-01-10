# Cloudinary File Upload - Frontend Implementation Guide

## Quick Start

### 1. Install Required Package (Already Done)

```bash
npm install axios
```

## File Upload Pattern

### Basic FormData Structure

```javascript
const formData = new FormData();
formData.append("field1", value1);
formData.append("field2", value2);
formData.append("file", fileObject); // or 'image', 'avatar' depending on endpoint

const config = {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
};

const response = await axios.post("/api/endpoint", formData, config);
```

---

## Implementation Examples by Feature

### 1. Post Creation with Image/Video

**File:** `frontend/src/components/CreatePostModal.jsx`

```jsx
import { useState } from "react";
import axios from "axios";

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tag, setTag] = useState("GENERAL");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview for image
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !desc) {
      alert("Please fill all fields");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("desc", desc);
    formData.append("tag", tag);
    formData.append("college", localStorage.getItem("college") || "Global");

    if (file) {
      formData.append("file", file);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/posts`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      alert("Post created successfully!");
      setTitle("");
      setDesc("");
      setFile(null);
      setPreview(null);
      setProgress(0);
      onPostCreated(response.data);
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      alert(error.response?.data?.message || "Error creating post");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          required
        />
        <select value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="GENERAL">General</option>
          <option value="ANNOUNCEMENT">Announcement</option>
          <option value="MEME">Meme</option>
          <option value="QUESTION">Question</option>
        </select>

        {/* File Input */}
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {/* Preview */}
        {preview && (
          <div>
            <img src={preview} alt="preview" style={{ maxWidth: "200px" }} />
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div
            style={{ width: "100%", height: "4px", backgroundColor: "#e0e0e0" }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: "#4caf50",
                transition: "width 0.2s",
              }}
            />
          </div>
        )}

        <button type="submit" disabled={uploading}>
          {uploading ? `Uploading... ${progress}%` : "Post"}
        </button>
        <button type="button" onClick={onClose} disabled={uploading}>
          Cancel
        </button>
      </form>
    </div>
  );
}
```

---

### 2. Marketplace Listing with Product Image

**File:** `frontend/src/components/MarketPage.jsx`

```jsx
import { useState } from "react";
import axios from "axios";

export default function MarketPage() {
  const [listings, setListings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "BOOKS",
    condition: "GOOD",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setUploading(true);

    const uploadFormData = new FormData();
    uploadFormData.append("title", formData.title);
    uploadFormData.append("description", formData.description);
    uploadFormData.append("price", formData.price);
    uploadFormData.append("category", formData.category);
    uploadFormData.append("condition", formData.condition);
    uploadFormData.append(
      "college",
      localStorage.getItem("college") || "Global"
    );

    if (image) {
      uploadFormData.append("image", image);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/listings`,
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setListings([response.data, ...listings]);
      setFormData({
        title: "",
        description: "",
        price: "",
        category: "BOOKS",
        condition: "GOOD",
      });
      setImage(null);
      setPreview(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating listing:", error);
      alert(error.response?.data?.message || "Error creating listing");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {showCreateModal && (
        <div className="modal">
          <form onSubmit={handleCreateListing}>
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
            <input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
            />
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option value="BOOKS">Books</option>
              <option value="LAPTOPS">Laptops</option>
              <option value="PHONES">Phones</option>
              <option value="ACCESSORIES">Accessories</option>
              <option value="OTHER">Other</option>
            </select>

            <label>Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
            />

            {preview && (
              <img src={preview} alt="preview" style={{ maxWidth: "200px" }} />
            )}

            <button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Create Listing"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              disabled={uploading}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

---

### 3. Notes/Documents Upload

**File:** `frontend/src/components/NotesLibraryPage.jsx`

```jsx
import { useState } from "react";
import axios from "axios";

export default function NotesLibraryPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [noteData, setNoteData] = useState({
    title: "",
    description: "",
    subject: "",
    semester: "",
    branch: "",
    documentType: "Notes",
    tags: "",
  });
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleUploadNote = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a document to upload");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("title", noteData.title);
    formData.append("description", noteData.description);
    formData.append("subject", noteData.subject);
    formData.append("semester", noteData.semester);
    formData.append("branch", noteData.branch);
    formData.append("documentType", noteData.documentType);
    formData.append("tags", noteData.tags);
    formData.append("college", localStorage.getItem("college") || "Global");
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/notes`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      alert("Document uploaded successfully!");
      setNoteData({
        title: "",
        description: "",
        subject: "",
        semester: "",
        branch: "",
        documentType: "Notes",
        tags: "",
      });
      setFile(null);
      setFileName("");
      setProgress(0);
      setShowUploadModal(false);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert(error.response?.data?.message || "Error uploading document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <button onClick={() => setShowUploadModal(true)}>Upload Notes</button>

      {showUploadModal && (
        <div className="modal">
          <form onSubmit={handleUploadNote}>
            <input
              type="text"
              placeholder="Title"
              value={noteData.title}
              onChange={(e) =>
                setNoteData({ ...noteData, title: e.target.value })
              }
              required
            />
            <textarea
              placeholder="Description"
              value={noteData.description}
              onChange={(e) =>
                setNoteData({ ...noteData, description: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Subject"
              value={noteData.subject}
              onChange={(e) =>
                setNoteData({ ...noteData, subject: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Semester"
              value={noteData.semester}
              onChange={(e) =>
                setNoteData({ ...noteData, semester: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Branch"
              value={noteData.branch}
              onChange={(e) =>
                setNoteData({ ...noteData, branch: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={noteData.tags}
              onChange={(e) =>
                setNoteData({ ...noteData, tags: e.target.value })
              }
            />

            <label>Upload Document (PDF, DOC, etc.)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              onChange={handleFileChange}
              required
            />
            {fileName && <p>Selected: {fileName}</p>}

            {uploading && (
              <div>
                <progress value={progress} max="100"></progress>
                <p>{progress}%</p>
              </div>
            )}

            <button type="submit" disabled={uploading || !file}>
              {uploading ? `Uploading... ${progress}%` : "Upload Document"}
            </button>
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              disabled={uploading}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

---

### 4. Lost & Found Item with Image

**File:** `frontend/src/components/LostFoundPage.jsx`

```jsx
const handleCreatePost = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("title", postData.title);
  formData.append("description", postData.description);
  formData.append("type", postData.type);
  formData.append("category", postData.category);
  formData.append("location", postData.location);
  formData.append("date", postData.date);
  formData.append("itemName", postData.itemName);
  formData.append("color", postData.color);
  formData.append("college", localStorage.getItem("college") || "Global");

  if (image) {
    formData.append("image", image);
  }

  try {
    const token = localStorage.getItem("token");
    await axios.post(
      `${
        import.meta.env.VITE_API_URL || "http://localhost:5000"
      }/api/lost-found`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    alert("Post created successfully!");
    resetForm();
  } catch (error) {
    alert(error.response?.data?.message || "Error creating post");
  }
};
```

---

### 5. Profile Avatar Upload

**File:** `frontend/src/components/ProfilePage.jsx`

```jsx
import { useState } from "react";
import axios from "axios";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [updating, setUpdating] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const formData = new FormData();
    formData.append("name", profile.name);
    formData.append("bio", profile.bio);
    formData.append("college", profile.college);
    formData.append("branch", profile.branch);
    formData.append("semester", profile.semester);
    formData.append("skills", profile.skills.join(", "));

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/profile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfile(response.data);
      setAvatarFile(null);
      setAvatarPreview(null);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.message || "Error updating profile");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleUpdateProfile}>
        <div>
          <label>Avatar</label>
          <img
            src={avatarPreview || profile?.avatar}
            alt="avatar"
            style={{ width: "100px", height: "100px", borderRadius: "50%" }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={updating}
          />
        </div>

        <input
          type="text"
          value={profile?.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
        <textarea
          value={profile?.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Bio"
        />

        <button type="submit" disabled={updating}>
          {updating ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}
```

---

## Common Patterns

### Error Handling

```javascript
try {
  const response = await axios.post(url, formData, config);
  // Handle success
} catch (error) {
  if (error.response?.status === 413) {
    alert("File too large! Check size limits.");
  } else if (error.response?.status === 401) {
    alert("Please login first");
    // Redirect to login
  } else {
    alert(error.response?.data?.message || "Upload failed");
  }
}
```

### Progress Bar Component

```jsx
function UploadProgress({ progress }) {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ height: "4px", backgroundColor: "#e0e0e0" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: "#4caf50",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <p>{progress}%</p>
    </div>
  );
}
```

### Validation Before Upload

```javascript
const validateFile = (file, maxSize = 50) => {
  const MB = 1024 * 1024;
  if (file.size > maxSize * MB) {
    return `File exceeds ${maxSize}MB limit`;
  }
  return null;
};

const error = validateFile(file);
if (error) {
  alert(error);
  return;
}
```

---

## Environment Variables

Add to `.env` if using different API URL:

```env
VITE_API_URL=http://localhost:5000
```

Access in code:

```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
```

---

## File Size Limits by Endpoint

| Endpoint          | Field    | Max Size |
| ----------------- | -------- | -------- |
| `/api/posts`      | `file`   | 50 MB    |
| `/api/listings`   | `image`  | 20 MB    |
| `/api/lost-found` | `image`  | 15 MB    |
| `/api/notes`      | `file`   | 100 MB   |
| `/api/profile`    | `avatar` | 10 MB    |
| `/api/notices`    | `file`   | 30 MB    |

---

## Troubleshooting

### "413 Payload Too Large"

- File exceeds endpoint's size limit
- Compress image before upload
- Use FileReader to preview before sending

### "No file provided"

- FormData field name doesn't match: 'file' vs 'image' vs 'avatar'
- File input didn't select anything

### "Token not provided"

- Token not in localStorage
- Format should be: `Bearer <token>`
- Check Authorization header spelling

### Progress not updating

- Need `onUploadProgress` in axios config
- Calculate percentage: `(loaded / total) * 100`

---

## Best Practices

✅ **DO**:

- Validate files before upload
- Show progress bar for large files
- Use FormData for multipart uploads
- Include error handling
- Store token securely in localStorage

❌ **DON'T**:

- Send file as JSON (use FormData)
- Forget Content-Type multipart/form-data
- Skip error handling
- Upload without token
- Trust only frontend validation

---
