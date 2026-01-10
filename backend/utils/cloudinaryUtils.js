const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder path
 * @param {string} resourceType - Type: auto, image, video, raw
 * @returns {Promise<Object>} Upload result with secure_url and public_id
 */
const uploadToCloudinary = async (
  filePath,
  folder = "Neutron",
  resourceType = "auto"
) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: resourceType,
      overwrite: false,
      unique_filename: true,
    });

    // Delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
      type: result.resource_type,
      format: result.format,
    };
  } catch (error) {
    // Delete local file if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Upload from buffer (for streaming/API data)
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - Cloudinary folder path
 * @param {string} resourceType - Type: auto, image, video, raw
 * @returns {Promise<Object>} Upload result
 */
const uploadBufferToCloudinary = async (
  buffer,
  fileName,
  folder = "Neutron",
  resourceType = "auto"
) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: resourceType,
          public_id: path.parse(fileName).name,
          overwrite: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
      type: result.resource_type,
      format: result.format,
    };
  } catch (error) {
    throw new Error(`Cloudinary buffer upload failed: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Type: image, video, raw
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

/**
 * Get file information from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} File metadata
 */
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

module.exports = {
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getFileInfo,
};
