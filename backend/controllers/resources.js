const Resource = require("../models/Resource");

/* GET RESOURCES (With Filters) */
const getResources = async (req, res) => {
  try {
    const { department, semester } = req.query;
    let query = {};

    // Apply filters if provided
    if (department) query.department = department;
    if (semester) query.semester = semester;

    const resources = await Resource.find(query).sort({ createdAt: -1 });
    res.status(200).json(resources);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPLOAD RESOURCE */
const uploadResource = async (req, res) => {
  try {
    const { uploaderId, title, subject, department, semester, category } =
      req.body;

    const filePath = req.file ? req.file.filename : "";

    const newResource = new Resource({
      uploaderId,
      title,
      subject,
      department,
      semester,
      category,
      fileUrl: filePath,
    });

    await newResource.save();

    const resources = await Resource.find({ department, semester });
    res.status(201).json(resources);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

module.exports = { getResources, uploadResource };
