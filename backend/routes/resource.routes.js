const router = require("express").Router();
let Resource = require("../models/resource.model");
const verifyToken = require("../middleware/auth.middleware");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const sharp = require("sharp"); // For image processing and watermarking
const { spawn } = require("child_process"); // For calling 'convert' (ImageMagick)
const fs = require("fs/promises");
const path = require("path");
const os = require("os"); // For temporary directory

// 1. CLOUDINARY CONFIGURATION
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage for temporary files before processing
const tempStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const tempDir = path.join(os.tmpdir(), "neutron-uploads");
    await fs.mkdir(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: tempStorage });

// --- HELPER to get college from request ---
const getCollegeFromRequest = (req) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.college;
    } catch (e) {
      // If token is expired or invalid, fall back to x-college header (for guest viewing or during transition)
      return req.headers["x-college"];
    }
  }
  // If no token, rely on x-college header (for initial guest view)
  return req.headers["x-college"];
};

// --- PDF to Image Conversion & Watermarking Function ---
async function processPdfToWatermarkedImages(pdfFilePath, user, college) {
  const tempOutputPrefix = path.join(
    os.tmpdir(),
    `neutron-pdf-page-${Date.now()}`
  );
  const imageUrls = [];
  const publicIds = [];

  try {
    // 1. Convert PDF pages to temporary images using ImageMagick 'convert'
    const command = "magick";
    const args = [
      "convert",
      "-density",
      "150", // DPI for output images
      pdfFilePath,
      `${tempOutputPrefix}-%d.png`, // Output format and naming convention
    ];

    console.log(`Executing ImageMagick command: ${command} ${args.join(" ")}`);

    await new Promise((resolve, reject) => {
      const convert = spawn(command, args);

      convert.stderr.on("data", (data) => {
        // Suppress the "convert is deprecated" warning, but keep other stderr
        const stderrString = data.toString();
        if (
          !stderrString.includes("The convert command is deprecated in IMv7")
        ) {
          console.error(`ImageMagick STDERR: ${stderrString}`);
        }
      });

      convert.on("close", (code) => {
        if (code === 0) resolve();
        else
          reject(new Error(`ImageMagick 'convert' exited with code ${code}`));
      });
      convert.on("error", (err) => {
        console.error("Failed to start ImageMagick 'magick':", err);
        reject(
          new Error(
            "ImageMagick 'magick' command not found or failed to execute. Is ImageMagick installed and in PATH (and specifically 'magick' executable)?"
          )
        );
      });
    });

    // 2. Read generated images, watermark, and upload to Cloudinary
    let pageNum = 0;
    while (true) {
      const pageImagePath = `${tempOutputPrefix}-${pageNum}.png`;
      try {
        await fs.access(pageImagePath); // Check if file exists
        const originalImageBuffer = await fs.readFile(pageImagePath);

        // --- MODIFICATION START ---
        // Get dimensions of the current page image
        const imageMetadata = await sharp(originalImageBuffer).metadata();
        const { width, height } = imageMetadata;

        if (!width || !height) {
          throw new Error(`Could not get dimensions for image page ${pageNum}`);
        }

        const watermarkText = `NEUTRON PORTAL • ${college.toUpperCase()} • ${user.username.toUpperCase()} • DO NOT COPY`;
        const fontSize = Math.max(20, Math.min(50, Math.floor(width / 30))); // Dynamic font size based on image width
        const rotationAngle = -45; // Constant rotation

        // Create a blank SVG for the watermark, dynamically sized
        const svgWatermark = `
          <svg width="${width}" height="${height}">
            <text x="50%" y="50%" font-family="Arial" font-size="${fontSize}" fill="#000000" fill-opacity="0.2"
                  text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotationAngle} ${
          width / 2
        } ${height / 2})">
              ${watermarkText}
            </text>
            <text x="50%" y="25%" font-family="Arial" font-size="${fontSize}" fill="#000000" fill-opacity="0.2"
                  text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotationAngle} ${
          width / 2
        } ${height / 2})">
              ${watermarkText}
            </text>
            <text x="50%" y="75%" font-family="Arial" font-size="${fontSize}" fill="#000000" fill-opacity="0.2"
                  text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotationAngle} ${
          width / 2
        } ${height / 2})">
              ${watermarkText}
            </text>
            <text x="25%" y="50%" font-family="Arial" font-size="${fontSize}" fill="#000000" fill-opacity="0.2"
                  text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotationAngle} ${
          width / 2
        } ${height / 2})">
              ${watermarkText}
            </text>
            <text x="75%" y="50%" font-family="Arial" font-size="${fontSize}" fill="#000000" fill-opacity="0.2"
                  text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotationAngle} ${
          width / 2
        } ${height / 2})">
              ${watermarkText}
            </text>
          </svg>
        `;
        // --- MODIFICATION END ---

        const watermarkedImageBuffer = await sharp(originalImageBuffer)
          .composite([
            {
              input: Buffer.from(svgWatermark),
              blend: "over",
              gravity: "centre",
            },
          ])
          .png() // Output as PNG, or .jpeg() for JPG
          .toBuffer();

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: "neutron_resource_images", resource_type: "image" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(watermarkedImageBuffer);
        });

        imageUrls.push(uploadResult.secure_url);
        publicIds.push(uploadResult.public_id);

        await fs.unlink(pageImagePath); // Clean up temporary page image
        pageNum++;
      } catch (err) {
        if (err.code === "ENOENT") {
          // File not found, means no more pages
          break;
        }
        throw err; // Other error, rethrow
      }
    }

    if (imageUrls.length === 0) {
      throw new Error(
        "No images were generated from the PDF. PDF might be empty or corrupt."
      );
    }

    return { imageUrls, publicIds };
  } finally {
    // Clean up temporary PDF file
    try {
      await fs.unlink(pdfFilePath);
    } catch (err) {
      console.error(
        `Failed to delete temporary PDF file ${pdfFilePath}: ${err}`
      );
    }
    // Also clean up any remaining temporary page images
    let cleanupPageNum = 0;
    while (true) {
      const pageImagePath = `${tempOutputPrefix}-${cleanupPageNum}.png`;
      try {
        await fs.access(pageImagePath);
        await fs.unlink(pageImagePath);
        cleanupPageNum++;
      } catch (err) {
        if (err.code === "ENOENT") break;
        console.error(
          `Failed to delete temporary page image ${pageImagePath}: ${err}`
        );
        break; // Stop if another error occurs during cleanup
      }
    }
  }
}

// --- 1. GET RESOURCES (Updated to return imageUrls) ---
router.get("/", async (req, res) => {
  try {
    const college = getCollegeFromRequest(req);

    if (!college) {
      return res.status(400).json("Error: No college specified.");
    }

    const query = { college: college };

    if (req.query.subject)
      query.subject = { $regex: req.query.subject, $options: "i" };
    if (req.query.semester) query.semester = req.query.semester;
    if (req.query.branch) query.branch = req.query.branch;

    const resources = await Resource.find(query)
      .populate("author", "username _id")
      .sort({ createdAt: -1 });

    // Frontend expects imageUrls array
    res.json(resources);
  } catch (err) {
    console.error("GET /resources error:", err);
    res.status(400).json("Error: " + err);
  }
});

// --- 2. ADD RESOURCE (Handles all file types, converts PDFs) ---
router.post("/add", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided." });
    }

    const { title, description, subject, semester, branch } = req.body;
    const { path: tempFilePath, mimetype } = req.file;

    let imageUrls = [];
    let publicIds = [];

    if (mimetype === "application/pdf") {
      console.log("PDF detected. Converting to watermarked images...");
      const result = await processPdfToWatermarkedImages(
        tempFilePath,
        req.user,
        req.user.college
      );
      imageUrls = result.imageUrls;
      publicIds = result.publicIds;
    } else {
      // Handle non-PDF files: upload directly as a single image
      console.log("Non-PDF file detected. Uploading directly.");
      // For simplicity, we'll treat non-PDFs as single image uploads here.
      // If you need to handle other document types (DOCX, PPTX) as "viewable images),
      // you'd need another conversion tool (e.g., LibreOffice headless).
      // For now, if it's not a PDF, we'll upload it as-is, assuming it's an image.
      // If it's a DOCX/TXT, this would try to upload it as an image and might fail or be suboptimal.
      // Refine this else block based on exact non-PDF types you expect.

      const uploadResult = await new Promise(async (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "neutron_resource_single_files", resource_type: "auto" }, // Use 'auto'
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(await fs.readFile(tempFilePath));
      });
      imageUrls.push(uploadResult.secure_url);
      publicIds.push(uploadResult.public_id);

      await fs.unlink(tempFilePath); // Clean up temp file
    }

    if (imageUrls.length === 0) {
      return res
        .status(400)
        .json({
          error:
            "No viewable content could be generated from the uploaded file.",
        });
    }

    const newResource = new Resource({
      title,
      description,
      subject,
      semester,
      branch,
      imageUrls,
      publicIds, // Store array of public IDs
      author: req.user.userId,
      college: req.user.college,
    });

    await newResource.save();
    res.status(201).json("Resource added!");
  } catch (err) {
    console.error("Error in ADD /resources:", err);
    res
      .status(500)
      .json({ error: "Failed to upload and process resource: " + err.message });
  } finally {
    // Ensure any temp file from multer is cleaned up in case of error
    if (req.file) {
      // Changed condition to just check if req.file exists
      try {
        await fs.access(req.file.path); // Check if the file still exists before unlinking
        await fs.unlink(req.file.path);
      } catch (e) {
        if (e.code !== "ENOENT") {
          // Ignore "file not found" errors during cleanup
          console.error(
            `Failed to delete multer temp file ${req.file.path}:`,
            e
          );
        }
      }
    }
  }
});

// --- 3. DELETE RESOURCE (Updated to delete all images) ---
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) return res.status(404).json("Resource not found.");

    // Ensure the user deleting the resource is the author
    if (resource.author.toString() !== req.user.userId) {
      return res
        .status(403)
        .json("User not authorized to delete this resource.");
    }

    // --- Delete all associated images from Cloudinary ---
    if (resource.publicIds && resource.publicIds.length > 0) {
      await Promise.all(
        resource.publicIds.map(async (publicId) => {
          try {
            await cloudinary.uploader.destroy(publicId, {
              resource_type: "image",
            });
          } catch (cloudErr) {
            console.error(
              `Cloudinary delete warning for publicId ${publicId}:`,
              cloudErr
            );
            // Don't block deletion of resource if a Cloudinary image fails to delete
          }
        })
      );
    }

    await resource.deleteOne();
    res.json("Resource deleted.");
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
