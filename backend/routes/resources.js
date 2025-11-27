const express = require("express");
const { getResources } = require("../controllers/resources.js");
const { verifyToken } = require("../middleware/auth.middleware.js");

const router = express.Router();

/* READ */
router.get("/", verifyToken, getResources);

module.exports = router;
