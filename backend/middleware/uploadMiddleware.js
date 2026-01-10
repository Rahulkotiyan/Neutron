const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Configure storage for different file types
const createStorage = (folder, resourceType = "auto") => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `Neutron/${folder}`,
      resource_type: resourceType,
      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt",
        "zip",
        "mp4",
        "avi",
        "mov",
        "mkv",
      ],
    },
  });
};

// Multer instances for different upload types
const uploadPost = multer({
  storage: createStorage("posts", "auto"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const uploadProfile = multer({
  storage: createStorage("profiles", "image"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadListing = multer({
  storage: createStorage("listings", "image"),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const uploadNote = multer({
  storage: createStorage("notes", "auto"),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for documents
});

const uploadLostFound = multer({
  storage: createStorage("lost-found", "image"),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

const uploadNotice = multer({
  storage: createStorage("notices", "auto"),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

const uploadEvent = multer({
  storage: createStorage("events", "image"),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = {
  uploadPost,
  uploadProfile,
  uploadListing,
  uploadNote,
  uploadLostFound,
  uploadNotice,
  uploadEvent,
};
