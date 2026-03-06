import imageCompression from 'browser-image-compression';

// Default compression configurations
const COMPRESSION_CONFIGS = {
  post: {
    maxSizeMB: 2, // 2MB max
    maxWidthOrHeight: 1920, // Max dimension
    quality: 0.85, // 85% quality
    preserveExif: false,
    useWebWorker: true,
  },

  comment: {
    maxSizeMB: 1, // 1MB max for comments
    maxWidthOrHeight: 1280, // Smaller for comments
    quality: 0.8, // 80% quality
    preserveExif: false,
    useWebWorker: true,
  },

  avatar: {
    maxSizeMB: 0.5, // 500KB max for avatars
    maxWidthOrHeight: 400, // Small for avatars
    quality: 0.9, // Higher quality for faces
    preserveExif: false,
    useWebWorker: true,
  },

  banner: {
    maxSizeMB: 2, // 2MB max for banners
    maxWidthOrHeight: 1920, // Wide banners
    quality: 0.85, // 85% quality
    preserveExif: false,
    useWebWorker: true,
  }
};

export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const validateImage = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Please use JPEG, PNG, GIF, or WebP.`);
  }

  if (file.size > maxSize) {
    throw new Error(`File size too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed is 10MB.`);
  }

  return true;
};

export const compressImage = async (file, type = 'post', customOptions = {}) => {
  // Get configuration for the specified type
  const config = COMPRESSION_CONFIGS[type] || COMPRESSION_CONFIGS.post;

  // Merge with any custom options
  const compressionOptions = { ...config, ...customOptions };

  try {
    console.log(`🔄 Compressing ${type} image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    const compressedFile = await imageCompression(file, compressionOptions);

    const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(2);
    console.log(`✅ Image compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% reduction)`);

    return compressedFile;
  } catch (error) {
    console.error('❌ Error compressing image:', error);
    throw error;
  }
};
