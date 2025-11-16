const router = require('express').Router();
let Job = require('../models/job.model');
const verifyToken = require('../middleware/auth.middleware');

// --- (GET) Get all jobs for a college ---
router.get('/', verifyToken, async (req, res) => {
  try {
    const jobs = await Job.find({ college: req.user.college })
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// --- (POST) Add a new job ---
// You could add extra checks here to only allow admins to post jobs
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { title, company, description, package, applyLink } = req.body;
    
    const newJob = new Job({
      title,
      company,
      description,
      package,
      applyLink,
      college: req.user.college,
    });

    await newJob.save();
    res.json('Job posting added!');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;
