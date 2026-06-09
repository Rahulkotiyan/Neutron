const multer = require("multer");

// Image processing middleware (pass-through — client-side compression is trusted)
const processImage = async (req, res, next) => {
  next();
};

// Image validation middleware
const validateImageUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      message: `Unsupported file type: ${req.file.mimetype}. Please use JPEG, PNG, GIF, or WebP.`
    });
  }

  if (req.file.size > maxSize) {
    return res.status(400).json({
      message: `File size too large: ${(req.file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed is 10MB.`
    });
  }

  next();
};

module.exports = {
  processImage,
  validateImageUpload,
};
