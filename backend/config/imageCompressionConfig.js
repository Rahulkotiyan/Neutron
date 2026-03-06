// Image compression configuration
const IMAGE_COMPRESSION_CONFIG = {
  // Post images (main feed images)
  POST_IMAGES: {
    maxSizeMB: 2, // 2MB max
    maxWidthOrHeight: 1920, // Max dimension
    quality: 0.85, // 85% quality
    preserveExif: false,
    useWebWorker: true,
  },

  // Comment images (smaller, for replies)
  COMMENT_IMAGES: {
    maxSizeMB: 1, // 1MB max
    maxWidthOrHeight: 1280, // Smaller for comments
    quality: 0.8, // 80% quality
    preserveExif: false,
    useWebWorker: true,
  },

  // Profile avatars (small, square)
  AVATAR_IMAGES: {
    maxSizeMB: 0.5, // 500KB max
    maxWidthOrHeight: 400, // Small for avatars
    quality: 0.9, // Higher quality for faces
    preserveExif: false,
    useWebWorker: true,
  },

  // Profile banners (wider, larger)
  BANNER_IMAGES: {
    maxSizeMB: 2, // 2MB max
    maxWidthOrHeight: 1920, // Wide banners
    quality: 0.85, // 85% quality
    preserveExif: false,
    useWebWorker: true,
  },

  // Validation settings
  VALIDATION: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },

  // Backend processing options
  BACKEND_PROCESSING: {
    enableSharpProcessing: false, // Enable additional Sharp processing
    enableMetadataLogging: true, // Log compression stats
    enableFormatConversion: false, // Convert to WebP for better compression
  }
};

// Get compression config by type
const getCompressionConfig = (type) => {
  switch (type) {
    case 'post':
      return IMAGE_COMPRESSION_CONFIG.POST_IMAGES;
    case 'comment':
      return IMAGE_COMPRESSION_CONFIG.COMMENT_IMAGES;
    case 'avatar':
      return IMAGE_COMPRESSION_CONFIG.AVATAR_IMAGES;
    case 'banner':
      return IMAGE_COMPRESSION_CONFIG.BANNER_IMAGES;
    default:
      return IMAGE_COMPRESSION_CONFIG.POST_IMAGES;
  }
};

// Get validation config
const getValidationConfig = () => IMAGE_COMPRESSION_CONFIG.VALIDATION;

// Get backend processing config
const getBackendProcessingConfig = () => IMAGE_COMPRESSION_CONFIG.BACKEND_PROCESSING;

module.exports = {
  IMAGE_COMPRESSION_CONFIG,
  getCompressionConfig,
  getValidationConfig,
  getBackendProcessingConfig
};
