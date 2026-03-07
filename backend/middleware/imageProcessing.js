const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

// Image processing middleware for compressed images
const processImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }

  try {

    const buffer = req.file.buffer;

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    // Optional: Further processing if needed (e.g., format conversion, additional compression)
    // For now, we trust the client-side compression

    // Add metadata to request for logging/analytics
    req.imageMetadata = {
      originalSize: req.file.size,
      dimensions: `${metadata.width}x${metadata.height}`,
      format: metadata.format,
      compressionRatio: req.file.size > 0 ? ((req.file.size - buffer.length) / req.file.size * 100).toFixed(2) : 0
    };

    next();
  } catch (error) {
    // Continue with upload even if processing fails
    next();
  }
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

// Image optimization middleware (optional additional processing)
const optimizeImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }

  try {
    // Optional: Add additional server-side optimization if needed
    // For now, we rely on client-side compression

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  processImage,
  validateImageUpload,
  optimizeImage
};
