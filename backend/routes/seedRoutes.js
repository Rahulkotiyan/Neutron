const express = require("express");
const router = express.Router();
const seedController = require("../controllers/seedContoller");

router.get("/", seedController.seedDatabase);

module.exports = router;
