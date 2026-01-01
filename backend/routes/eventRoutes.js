const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventContoller");

router.get("/", eventController.getEvents);

module.exports = router;
